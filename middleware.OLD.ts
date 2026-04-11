/**
 * middleware.ts  (raíz del proyecto, al lado de package.json)
 * Astral Evolution — Capa de seguridad completa
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  CAPAS IMPLEMENTADAS                                            │
 * │                                                                 │
 * │  1. Security Headers (todas las rutas)                         │
 * │     · Content-Security-Policy (CSP)                            │
 * │     · Strict-Transport-Security (HSTS) — solo producción       │
 * │     · X-Frame-Options                                          │
 * │     · X-Content-Type-Options                                   │
 * │     · Referrer-Policy                                          │
 * │     · Permissions-Policy                                       │
 * │     · X-XSS-Protection                                         │
 * │                                                                 │
 * │  2. Rate Limiting (rutas POST de API)                          │
 * │     · /api/checkout       → 5  req / hora / IP                 │
 * │     · /api/test-gemini    → 10 req / hora / IP                 │
 * │     · /api/webhooks/*     → 60 req / hora / IP                 │
 * │     · Store: Supabase (sin Redis, compatible Netlify)          │
 * │     · IP hasheada con SHA-256 + salt, nunca en crudo           │
 * │                                                                 │
 * │  3. Bloqueo básico de bots (POST sin User-Agent)               │
 * │                                                                 │
 * │  4. Security Logging Block                                     │
 * │     · [MW][INFO/WARN/ERROR][reqId] mensaje | contexto          │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * NOTA SOBRE RATE LIMITING SIN REDIS
 * ────────────────────────────────────
 * Netlify Functions son stateless: no hay memoria entre invocaciones.
 * La solución usa la función PostgreSQL `increment_rate_limit()` que fue
 * creada en 20260410_secure_anon_transactions_mp.sql.
 * Una sola llamada RPC es atómica y evita race conditions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import crypto                        from 'crypto';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface RateLimitConfig {
  maxAttempts: number; // máximo de requests permitidos en la ventana
  windowHours: number; // duración de la ventana en horas
}

// ════════════════════════════════════════════════════════════════
//  SECURITY LOGGING BLOCK
// ════════════════════════════════════════════════════════════════

function mwLog(
  level:    LogLevel,
  reqId:    string,
  message:  string,
  context?: Record<string, unknown>
): void {
  const ts     = new Date().toISOString();
  const prefix = `[MW][${level}][${reqId}]`;
  const ctx    = context ? ` | ${JSON.stringify(context)}` : '';
  const line   = `${ts} ${prefix} ${message}${ctx}`;

  if (level === 'INFO')  console.info(line);
  if (level === 'WARN')  console.warn(line);
  if (level === 'ERROR') console.error(line);
}

// ════════════════════════════════════════════════════════════════
//  FIN SECURITY LOGGING BLOCK
// ════════════════════════════════════════════════════════════════

// ─── Configuración de rate limits por ruta ───────────────────────────────────
//
//  La clave es el prefijo del path.
//  El middleware busca la primera coincidencia.
//
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/checkout':    { maxAttempts: 5,  windowHours: 1 },
  '/api/test-gemini': { maxAttempts: 10, windowHours: 1 },
  '/api/webhooks':    { maxAttempts: 60, windowHours: 1 }, // MP puede reintentar
};

// ─── Security Headers ────────────────────────────────────────────────────────

function getSecurityHeaders(isProduction: boolean): Record<string, string> {
  return {
    // ── Content-Security-Policy ──────────────────────────────────────────────
    // Ajusta los dominios si agregas nuevos servicios externos.
    'Content-Security-Policy': [
      "default-src 'self'",

      // Scripts: propio origen + SDK de Mercado Pago
      "script-src 'self' 'unsafe-inline' https://sdk.mercadopago.com https://www.mercadopago.com",

      // Estilos: propio origen + inline (requerido por Tailwind)
      "style-src 'self' 'unsafe-inline'",

      // Imágenes: propio + data URIs
      "img-src 'self' data: https:",

      // Fuentes
      "font-src 'self'",

      // Conexiones de red permitidas
      [
        "connect-src 'self'",
        "https://api.mercadopago.com",
        "https://www.mercadopago.com.ar",
        "https://*.supabase.co",
        "https://generativelanguage.googleapis.com",
        "https://api.twilio.com",
      ].join(' '),

      // Frames: solo checkout embebido de MP
      "frame-src 'self' https://www.mercadopago.com https://www.mercadopago.com.ar",

      // Bloqueos
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",

      // Fuerza HTTPS en producción
      ...(isProduction ? ['upgrade-insecure-requests'] : []),
    ].join('; '),

    // ── HSTS: fuerza HTTPS por 1 año ─────────────────────────────────────────
    // Activar SOLO en producción — rompe HTTP en desarrollo local.
    ...(isProduction
      ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload' }
      : {}),

    // ── Anti-clickjacking ─────────────────────────────────────────────────────
    'X-Frame-Options': 'SAMEORIGIN',

    // ── Bloquea MIME sniffing ─────────────────────────────────────────────────
    'X-Content-Type-Options': 'nosniff',

    // ── No filtrar referrer a dominios externos ───────────────────────────────
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // ── Deshabilitar APIs del navegador que no usamos ─────────────────────────
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'usb=()',
      'payment=(self "https://www.mercadopago.com")',
    ].join(', '),

    // ── XSS Protection para navegadores legacy ────────────────────────────────
    'X-XSS-Protection': '1; mode=block',
  };
}

// ─── Helpers de IP ───────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? '0.0.0.0'
  );
}

/**
 * Hashea la IP con SHA-256 + salt.
 * La IP nunca se guarda en crudo en la DB.
 * Configura IP_HASH_SALT en el .env para que sea único por proyecto.
 */
function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'astral-evolution-default-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

// ─── Rate Limiting via Supabase RPC ──────────────────────────────────────────

async function checkRateLimit(
  ipHash:   string,
  endpoint: string,
  config:   RateLimitConfig,
  reqId:    string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Si Supabase no está configurado, permitir el paso y advertir
  if (!supabaseUrl || !serviceKey) {
    mwLog('ERROR', reqId,
      'Rate limiting DESHABILITADO: Supabase no configurado. '
      + 'Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.'
    );
    return { allowed: true, remaining: config.maxAttempts, resetAt: new Date() };
  }

  // Ventana = inicio de la hora actual en UTC
  const now         = new Date();
  const windowStart = new Date(now);
  windowStart.setMinutes(0, 0, 0);

  const resetAt = new Date(windowStart);
  resetAt.setHours(resetAt.getHours() + config.windowHours);

  try {
    const supabase = createClient(supabaseUrl, serviceKey);

    // increment_rate_limit es atómica (INSERT ON CONFLICT DO UPDATE)
    // Definida en 20260410_secure_anon_transactions_mp.sql
    const { data, error } = await supabase.rpc('increment_rate_limit', {
      p_ip_hash:      ipHash,
      p_endpoint:     endpoint,
      p_window_start: windowStart.toISOString(),
    });

    if (error) {
      mwLog('ERROR', reqId,
        'Error al llamar increment_rate_limit — permitiendo request',
        { supabase_error: error.message, code: error.code }
      );
      return { allowed: true, remaining: config.maxAttempts, resetAt };
    }

    const count     = (data as number) ?? 1;
    const remaining = Math.max(0, config.maxAttempts - count);

    return { allowed: count <= config.maxAttempts, remaining, resetAt };

  } catch (err) {
    mwLog('ERROR', reqId,
      'Excepción inesperada en rate limiting — permitiendo request',
      { error: err instanceof Error ? err.message : String(err) }
    );
    return { allowed: true, remaining: config.maxAttempts, resetAt };
  }
}

// ─── Middleware principal ─────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const reqId      = Math.random().toString(36).slice(2, 9).toUpperCase();
  const path       = request.nextUrl.pathname;
  const method     = request.method;
  const isProd     = process.env.NODE_ENV === 'production';
  const secHeaders = getSecurityHeaders(isProd);

  // Clonar la respuesta para poder inyectarle headers
  const response = NextResponse.next();
  Object.entries(secHeaders).forEach(([k, v]) => response.headers.set(k, v));

  // ── 1. Bloqueo básico de bots ──────────────────────────────────────────────
  if (path.startsWith('/api/') && method === 'POST') {
    const ua = request.headers.get('user-agent') ?? '';
    if (!ua) {
      mwLog('WARN', reqId,
        'POST sin User-Agent bloqueado — posible bot o script automatizado',
        { path }
      );
      return new NextResponse(
        JSON.stringify({ error: 'Request no permitido', reqId }),
        {
          status:  400,
          headers: { 'Content-Type': 'application/json', ...secHeaders },
        }
      );
    }
  }

  // ── 2. Rate Limiting ───────────────────────────────────────────────────────
  if (method === 'POST' && path.startsWith('/api/')) {

    // Buscar la primera configuración cuyo prefijo coincida con el path
    const limitKey = Object.keys(RATE_LIMITS).find(k => path.startsWith(k));

    if (limitKey) {
      const config   = RATE_LIMITS[limitKey];
      const clientIp = getClientIp(request);
      const ipHash   = hashIp(clientIp);

      mwLog('INFO', reqId, `Rate limit check: ${path}`, {
        endpoint:        limitKey,
        ip_hash_preview: ipHash.substring(0, 8) + '...',
        max_attempts:    config.maxAttempts,
        window_hours:    config.windowHours,
      });

      const { allowed, remaining, resetAt } = await checkRateLimit(
        ipHash, limitKey, config, reqId
      );

      // Siempre inyectar headers de rate limit (buena práctica de API)
      response.headers.set('X-RateLimit-Limit',     String(config.maxAttempts));
      response.headers.set('X-RateLimit-Remaining', String(remaining));
      response.headers.set('X-RateLimit-Reset',     String(Math.floor(resetAt.getTime() / 1000)));

      if (!allowed) {
        const retryAfterSec = Math.ceil((resetAt.getTime() - Date.now()) / 1000);

        mwLog('WARN', reqId,
          `🚫 RATE LIMIT EXCEDIDO — ${path}`,
          {
            ip_hash_preview: ipHash.substring(0, 8) + '...',
            endpoint:        limitKey,
            limit:           config.maxAttempts,
            window_h:        config.windowHours,
            reset_at:        resetAt.toISOString(),
            retry_after_sec: retryAfterSec,
          }
        );

        return new NextResponse(
          JSON.stringify({
            error:   'Demasiados intentos. Por favor, espera antes de continuar.',
            resetAt: resetAt.toISOString(),
            reqId,
          }),
          {
            status: 429,
            headers: {
              'Content-Type':           'application/json',
              'Retry-After':            String(retryAfterSec),
              'X-RateLimit-Limit':      String(config.maxAttempts),
              'X-RateLimit-Remaining':  '0',
              'X-RateLimit-Reset':      String(Math.floor(resetAt.getTime() / 1000)),
              ...secHeaders,
            },
          }
        );
      }

      mwLog('INFO', reqId,
        `Rate limit OK — ${remaining} intentos restantes en esta ventana`,
        { endpoint: limitKey }
      );
    }
  }

  return response;
}

// ─── Matcher: aplicar a todo excepto assets estáticos ────────────────────────

export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas EXCEPTO:
     *   _next/static  → assets estáticos compilados
     *   _next/image   → optimización de imágenes
     *   favicon.ico
     *   Archivos con extensión (.png, .jpg, .svg, .webp, .ico, .woff2…)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
