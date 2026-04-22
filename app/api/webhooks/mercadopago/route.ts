/**
 * app/api/webhooks/mercadopago/route.ts
 * Webhook de Mercado Pago — verifica firma HMAC, actualiza transacción,
 * dispara generación de reporte y envía notificación WhatsApp.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { MercadoPagoWebhookSchema } from '@/lib/validations/schemas';

// ─── Verificación de firma HMAC-SHA256 ────────────────────────────────────────
function verifyMPSignature(request: NextRequest, rawBody: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.warn('[Webhook MP] MERCADOPAGO_WEBHOOK_SECRET no configurado — saltando verificación');
    return true; // Permitir en desarrollo si no hay secret
  }

  // MP envía x-signature: ts=<timestamp>,v1=<hash>
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  const dataId = new URL(request.url).searchParams.get('data.id');

  if (!xSignature) {
    console.error('[Webhook MP] Falta header x-signature');
    return false;
  }

  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => part.split('=') as [string, string])
  );
  const ts = parts['ts'];
  const v1 = parts['v1'];

  if (!ts || !v1) {
    console.error('[Webhook MP] Formato de firma inválido');
    return false;
  }

  // Construir el mensaje según la documentación de MP
  const manifest = [
    dataId ? `id:${dataId}` : null,
    xRequestId ? `request-id:${xRequestId}` : null,
    `ts:${ts}`,
  ]
    .filter(Boolean)
    .join(';');

  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  // Comparación en tiempo constante para evitar timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(v1, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );

  return isValid;
}

// ─── Notificación WhatsApp via Twilio ─────────────────────────────────────────
async function sendWhatsAppNotification(
  productName: string,
  amount: number,
  customerName: string,
  customerEmail: string
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM?.trim() ?? 'whatsapp:+14155238886';
  const toNumber = process.env.WHATSAPP_NOTIFY_TO?.trim();

  if (!accountSid || !authToken || !toNumber) {
    console.warn('[WhatsApp] Credenciales no configuradas — saltando notificación');
    return;
  }

  const message =
    `🌟 *Nueva venta en Astral Evolution*\n\n` +
    `📦 Producto: ${productName}\n` +
    `💰 Monto: $${amount.toFixed(2)} USD\n` +
    `👤 Cliente: ${customerName}\n` +
    `📧 Email: ${customerEmail}\n` +
    `⏰ Hora: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Montevideo' })}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams({
    From: fromNumber,
    To: `whatsapp:${toNumber}`,
    Body: message,
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[WhatsApp] Error Twilio:', err);
    } else {
      console.log('[WhatsApp] Notificación enviada OK');
    }
  } catch (err) {
    console.error('[WhatsApp] Error de red:', err);
  }
}

// ─── Vercel function config ───────────────────────────────────────────────────
export const maxDuration = 60;

// ─── Handler principal ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Leer body como texto para verificar firma
  const rawBody = await request.text();

  // 2. Verificar firma de MP
  if (!verifyMPSignature(request, rawBody)) {
    console.error('[Webhook MP] Firma inválida — rechazando');
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  // 3. Parsear y validar body
  let webhookData: unknown;
  try {
    webhookData = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = MercadoPagoWebhookSchema.safeParse(webhookData);
  if (!parsed.success) {
    console.error('[Webhook MP] Schema inválido:', parsed.error.errors);
    return NextResponse.json({ received: true }); // 200 para que MP no reintente
  }

  const { type, data } = parsed.data;

  // 4. Solo procesar pagos aprobados
  if (type !== 'payment' || !data?.id) {
    return NextResponse.json({ received: true });
  }

  const mpPaymentId = data.id;
  console.log(`[Webhook MP] Procesando pago ID: ${mpPaymentId}`);

  // 5. Consultar estado del pago en MP API
  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!mpToken) {
    return NextResponse.json({ error: 'Token de MP no configurado' }, { status: 500 });
  }

  let paymentDetails: {
    status: string;
    external_reference: string;
    transaction_amount: number;
    payer?: { email?: string; first_name?: string; last_name?: string };
  };

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });

    if (!mpRes.ok) {
      console.error('[Webhook MP] Error consultando pago:', mpRes.status);
      return NextResponse.json({ error: 'Error consultando pago' }, { status: 500 });
    }

    paymentDetails = await mpRes.json();
  } catch (err) {
    console.error('[Webhook MP] Error de red consultando pago:', err);
    return NextResponse.json({ error: 'Error de red' }, { status: 500 });
  }

  if (paymentDetails.status !== 'approved') {
    console.log(`[Webhook MP] Pago no aprobado (${paymentDetails.status}), ignorando`);
    return NextResponse.json({ received: true });
  }

  const transactionId = paymentDetails.external_reference;
  if (!transactionId) {
    console.error('[Webhook MP] No hay external_reference en el pago');
    return NextResponse.json({ received: true });
  }

  // 6. Actualizar transacción en Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: updatedTx, error: updateError } = await supabase
    .from('transactions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      mp_payment_id: mpPaymentId,
    })
    .eq('id', transactionId)
    .eq('status', 'pending') // Idempotencia: solo si estaba pendiente
    .select('*, products(name_es, slug, base_price_usd), users(name, email)')
    .single();

  if (updateError) {
    console.error('[Webhook MP] Error actualizando transacción:', updateError);
    // No retornar error 500 — MP reintentaría
    return NextResponse.json({ received: true });
  }

  if (!updatedTx) {
    console.log('[Webhook MP] Transacción no encontrada o ya procesada (idempotente)');
    return NextResponse.json({ received: true });
  }

  console.log(`[Webhook MP] Transacción ${transactionId} completada ✅`);

  // 7. Crear registro de reporte pendiente
  const { error: reportError } = await supabase.from('reports').insert({
    transaction_id: transactionId,
    status: 'pending',
  });

  if (reportError) {
    console.error('[Webhook MP] Error creando registro de reporte:', reportError);
  }

  // 8. Disparar generación de reporte (fire-and-forget: MP no espera el resultado)
  // generate-report guarda su propio estado en Supabase con idempotencia
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://astralevolution.com';
  fetch(`${appUrl}/api/generate-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId }),
  }).then(res => {
    if (!res.ok) console.error('[Webhook MP] generate-report respondió:', res.status);
    else console.log('[Webhook MP] generate-report iniciado OK');
  }).catch(err => console.error('[Webhook MP] Error disparando generación:', err));

  // 9. Notificación WhatsApp
  const productName = (updatedTx as any).products?.name_es ?? 'Producto desconocido';
  const customerName = (updatedTx as any).users?.name ?? 'Cliente';
  const customerEmail = (updatedTx as any).users?.email ?? '';
  const amount = paymentDetails.transaction_amount;

  sendWhatsAppNotification(productName, amount, customerName, customerEmail).catch((err) =>
    console.error('[WhatsApp] Error enviando notificación:', err)
  );

  return NextResponse.json({ received: true, status: 'completed' });
}
