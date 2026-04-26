/**
 * app/api/notify-whatsapp/route.ts
 * Astral Evolution — Notificación de pago aprobado por WhatsApp
 *
 * Llamado internamente desde el webhook de Mercado Pago.
 * NUNCA expuesto directamente al cliente final.
 *
 * Proveedor por defecto: Twilio WhatsApp API
 * Alternativa Meta Cloud API documentada al pie del archivo.
 *
 * Variables de entorno requeridas (.env):
 *   WHATSAPP_ACCOUNT_SID    → ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   WHATSAPP_AUTH_TOKEN     → tu auth token de Twilio
 *   WHATSAPP_FROM_NUMBER    → whatsapp:+14155238886  (sandbox Twilio)
 *   WHATSAPP_NOTIFY_NUMBER  → whatsapp:+59899424223 (tu número)
 *   NEXT_PUBLIC_APP_URL     → https://tu-dominio.com
 *
 * ─── SECURITY LOGGING BLOCK ───────────────────────────────────
 *  Formato: TIMESTAMP [WA][NIVEL][reqId] mensaje | {contexto}
 *
 *  [WA][FATAL]  → variables de entorno ausentes o inválidas
 *  [WA][ERROR]  → fallo de red o respuesta inesperada de Twilio
 *  [WA][WARN]   → Twilio devolvió error con código conocido
 *  [WA][INFO]   → envío exitoso, pasos del flujo normal
 * ──────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface TwilioResponse {
  sid?:        string;
  status?:     string;
  error_code?: number;
  message?:    string;
}

// ════════════════════════════════════════════════════════════════
//  SECURITY LOGGING BLOCK
// ════════════════════════════════════════════════════════════════

function waLog(
  level:    LogLevel,
  reqId:    string,
  message:  string,
  context?: Record<string, unknown>
): void {
  const ts     = new Date().toISOString();
  const prefix = `[WA][${level}][${reqId}]`;
  const ctx    = context ? ` | ${JSON.stringify(context)}` : '';
  const line   = `${ts} ${prefix} ${message}${ctx}`;

  if (level === 'INFO')                        console.info(line);
  if (level === 'WARN')                        console.warn(line);
  if (level === 'ERROR' || level === 'FATAL')  console.error(line);
}

// ─── Diagnóstico de errores de Twilio por código ─────────────────────────────
//
// Referencia: https://www.twilio.com/docs/errors
//
function diagnoseTwilioError(
  httpStatus: number,
  body:       TwilioResponse,
  reqId:      string
): void {
  const code = body.error_code;
  const msg  = body.message ?? '(sin mensaje)';

  // Log técnico completo siempre
  waLog('WARN', reqId, `Twilio HTTP ${httpStatus} — código de error: ${code}`, {
    twilio_http_status: httpStatus,
    twilio_error_code:  code,
    twilio_message:     msg,
    twilio_status:      body.status,
  });

  // Diagnóstico accionable por código conocido
  if (code === 21211)
    waLog('WARN', reqId,
      'DIAGNÓSTICO 21211: Número de destino inválido. '
      + 'Verifica WHATSAPP_NOTIFY_NUMBER: debe tener formato whatsapp:+CODIGO_PAIS_NUMERO.'
    );
  else if (code === 21608)
    waLog('WARN', reqId,
      'DIAGNÓSTICO 21608: Número no verificado en el sandbox de Twilio. '
      + 'Acción: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn '
      + '→ agrega y verifica el número de destino.'
    );
  else if (code === 63016)
    waLog('WARN', reqId,
      'DIAGNÓSTICO 63016: Template de WhatsApp no aprobado por Meta. '
      + 'Los mensajes de texto libre solo funcionan dentro de la ventana de 24 h '
      + 'de una conversación iniciada por el usuario. '
      + 'Fuera de esa ventana debes usar un template aprobado.'
    );
  else if (code === 20003)
    waLog('WARN', reqId,
      'DIAGNÓSTICO 20003: Credenciales de Twilio inválidas. '
      + 'Verifica WHATSAPP_ACCOUNT_SID y WHATSAPP_AUTH_TOKEN en el .env.'
    );
  else
    waLog('WARN', reqId, `DIAGNÓSTICO: error Twilio sin categoría definida — ${msg}`);
}

// ════════════════════════════════════════════════════════════════
//  FIN SECURITY LOGGING BLOCK
// ════════════════════════════════════════════════════════════════

// ─── Schema de validación (Zod) ───────────────────────────────────────────────

const NotifySchema = z.object({
  amount:      z.number().positive(),
  currency:    z.string().min(3).max(3),
  productSlug: z.enum(['lectura-esencial', 'consulta-evolutiva', 'especial-parejas']),
  payerEmail:  z.string().email().optional(),
  paymentId:   z.string().optional(),
});

// ─── Nombres de producto para el mensaje ─────────────────────────────────────

const PRODUCT_DISPLAY: Record<string, string> = {
  'lectura-esencial':   '🌟 Lectura Esencial',
  'consulta-evolutiva': '✨ Consulta Evolutiva',
  'especial-parejas':   '💫 Especial Parejas',
};

// ─── Construcción del mensaje WhatsApp ───────────────────────────────────────

function buildWhatsAppMessage(data: z.infer<typeof NotifySchema>): string {
  const product = PRODUCT_DISPLAY[data.productSlug] ?? data.productSlug;
  const amount  = `${data.currency} ${data.amount.toLocaleString('es-AR')}`;
  const payer   = data.payerEmail ? `\n👤 Cliente: ${data.payerEmail}` : '';
  const payId   = data.paymentId  ? `\n🔑 MP ID: ${data.paymentId}`   : '';
  const ts      = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    `🚀 *NUEVO PAGO APROBADO*\n`
    + `_Astral Evolution_\n\n`
    + `📦 Producto: ${product}\n`
    + `💰 Monto: ${amount}`
    + payer
    + payId
    + `\n🕐 ${ts}\n\n`
    + `_Reporte generándose automáticamente..._`
  );
}

// ─── Envío via Twilio WhatsApp ────────────────────────────────────────────────

async function sendWhatsApp(
  message: string,
  reqId:   string
): Promise<{ ok: boolean; sid?: string; error?: string }> {

  // ── [LOG-WA-01] Validación de credenciales ──────────────────────────────
  const accountSid = process.env.WHATSAPP_ACCOUNT_SID?.trim();
  const authToken  = process.env.WHATSAPP_AUTH_TOKEN?.trim();
  const fromNumber = process.env.WHATSAPP_FROM_NUMBER?.trim();
  const toNumber   = process.env.WHATSAPP_NOTIFY_NUMBER?.trim();

  const missing = [
    !accountSid  && 'WHATSAPP_ACCOUNT_SID',
    !authToken   && 'WHATSAPP_AUTH_TOKEN',
    !fromNumber  && 'WHATSAPP_FROM_NUMBER',
    !toNumber    && 'WHATSAPP_NOTIFY_NUMBER',
  ].filter(Boolean);

  if (missing.length > 0) {
    waLog('FATAL', reqId,
      '[LOG-WA-01] Variables de entorno de Twilio ausentes. '
      + 'El sistema no puede enviar notificaciones WhatsApp.',
      { missing_vars: missing }
    );
    return { ok: false, error: `Variables ausentes: ${missing.join(', ')}` };
  }

  waLog('INFO', reqId, '[LOG-WA-01] Credenciales de Twilio detectadas ✓', {
    account_sid_preview: accountSid!.substring(0, 8) + '...',
    from: fromNumber,
    to:   toNumber!.slice(0, 15) + '...',    // no loguear número completo
  });

  // ── [LOG-WA-02] Envío a Twilio API ──────────────────────────────────────
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  waLog('INFO', reqId, '[LOG-WA-02] Enviando request a Twilio WhatsApp API', {
    endpoint:    url.replace(accountSid!, 'REDACTED'),
    message_len: message.length,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber!,
        To:   toNumber!,
        Body: message,
      }),
    });
  } catch (networkErr) {
    // ── [LOG-WA-03] Error de red ─────────────────────────────────────────
    waLog('ERROR', reqId,
      '[LOG-WA-03] Error de red al conectar con api.twilio.com. '
      + 'Verifica que las Netlify Functions tengan salida a internet.',
      {
        error_name:    networkErr instanceof Error ? networkErr.name    : 'unknown',
        error_message: networkErr instanceof Error ? networkErr.message : String(networkErr),
      }
    );
    return { ok: false, error: 'Error de red al conectar con Twilio' };
  }

  // ── [LOG-WA-04] Respuesta de Twilio ─────────────────────────────────────
  const body = await res.json().catch(() => ({}) as TwilioResponse) as TwilioResponse;

  if (!res.ok) {
    diagnoseTwilioError(res.status, body, reqId);
    return {
      ok:    false,
      error: `Twilio error ${body.error_code ?? res.status}: ${body.message ?? 'sin detalle'}`,
    };
  }

  waLog('INFO', reqId, '[LOG-WA-05] ✅ Mensaje WhatsApp enviado correctamente', {
    twilio_sid:    body.sid,
    twilio_status: body.status,
  });

  return { ok: true, sid: body.sid };
}

// ─── Handler HTTP ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 9).toUpperCase();

  // Proteger el endpoint: requiere x-internal-secret (INTERNAL_API_SECRET en Vercel).
  // Las llamadas server-to-server no envían origin, por lo que la verificación de origen no funciona.
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  const providedSecret = request.headers.get('x-internal-secret');

  if (!internalSecret || providedSecret !== internalSecret) {
    waLog('WARN', reqId, '[LOG-WA-00] Llamada no autorizada al endpoint interno de WhatsApp');
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Validar body con Zod
  let raw: unknown;
  try { raw = await request.json(); }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

  const parsed = NotifySchema.safeParse(raw);
  if (!parsed.success) {
    waLog('WARN', reqId, 'Payload de notificación inválido', {
      errors: parsed.error.flatten(),
    });
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 422 });
  }

  waLog('INFO', reqId, 'Notificación de pago recibida', {
    product:  parsed.data.productSlug,
    amount:   parsed.data.amount,
    currency: parsed.data.currency,
  });

  const message = buildWhatsAppMessage(parsed.data);
  const result  = await sendWhatsApp(message, reqId);

  if (!result.ok) {
    // Devolvemos 200 porque el pago YA fue procesado exitosamente.
    // La notificación es best-effort; un fallo aquí no debe revertir nada.
    waLog('WARN', reqId, 'Notificación WhatsApp falló (pago ya procesado)', {
      error: result.error,
    });
    return NextResponse.json(
      { warning: 'Pago procesado, notificación WhatsApp fallida', error: result.error },
      { status: 200 }
    );
  }

  return NextResponse.json({ success: true, sid: result.sid });
}


/*
──────────────────────────────────────────────────────────────────
  ALTERNATIVA: Meta Cloud API (sin Twilio, gratis hasta cierto volumen)
──────────────────────────────────────────────────────────────────

  Si preferís usar Meta directamente, reemplazá la función sendWhatsApp
  por esta implementación y agrega al .env:

    META_WA_PHONE_NUMBER_ID=tu_phone_number_id
    META_WA_TOKEN=tu_bearer_token_permanente_de_sistema
    WHATSAPP_NOTIFY_NUMBER=598XXXXXXXX   ← solo dígitos, sin "whatsapp:"

  async function sendWhatsAppMeta(message: string, reqId: string) {
    const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
    const token         = process.env.META_WA_TOKEN;
    const to            = process.env.WHATSAPP_NOTIFY_NUMBER;

    if (!phoneNumberId || !token || !to) {
      waLog('FATAL', reqId, 'Variables META_WA_* ausentes');
      return { ok: false, error: 'Meta WA no configurado' };
    }

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      waLog('WARN', reqId, `Meta Graph API error ${res.status}`, { body });
      return { ok: false, error: `Meta error ${res.status}` };
    }

    waLog('INFO', reqId, '✅ Mensaje Meta WhatsApp enviado', { body });
    return { ok: true, sid: body.messages?.[0]?.id };
  }
──────────────────────────────────────────────────────────────────
*/
