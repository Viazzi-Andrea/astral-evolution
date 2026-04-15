import { NextRequest, NextResponse } from 'next/server';

// ─── In-memory rate limit store (use Upstash Redis in production for multi-instance) ───
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(ip: string, type: 'payment' | 'report' | 'general'): string {
  return `${type}:${ip}`;
}

function checkRateLimit(
  ip: string,
  type: 'payment' | 'report' | 'general',
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = getRateLimitKey(ip, type);
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// ─── Clean expired entries every 5 minutes ───
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // ─── Rate Limiting per route type ───
  if (pathname.startsWith('/api/checkout') || pathname.startsWith('/api/webhooks/mercadopago')) {
    const limit = checkRateLimit(ip, 'payment', 5, 60 * 60 * 1000); // 5/hour
    if (!limit.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiados intentos de pago. Intenta en 1 hora.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  if (pathname.startsWith('/api/generate-report') || pathname.startsWith('/api/test-gemini')) {
    const limit = checkRateLimit(ip, 'report', 10, 60 * 60 * 1000); // 10/hour
    if (!limit.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Límite de generación de reportes alcanzado. Intenta en 1 hora.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  const response = NextResponse.next();

  // ─── Security Headers ───
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://http2.mlstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://http2.mlstatic.com https://secure.mlstatic.com",
    "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://api.mercadopago.com",
    "frame-src 'self' https://sdk.mercadopago.com https://www.mercadopago.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  response.headers.set(
    'Expect-CT',
    'max-age=86400, enforce'
  );

  // Remove fingerprinting headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
