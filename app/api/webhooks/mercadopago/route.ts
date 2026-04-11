/**
 * POST /api/webhooks/mercadopago
 *
 * Recibe notificaciones IPN de Mercado Pago, verifica la autenticidad
 * y dispara la generación del reporte astrológico.
 *
 * Docs MP: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/ipn
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase Admin Client (service role — solo servidor) ─────────────────────
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

// ─── Verificación de firma MP (x-signature header) ───────────────────────────
function verifyMpSignature(request: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[webhook-mp] MP_WEBHOOK_SECRET no configurado — saltando verificación');
    return true; // En sandbox sin secret, permitir. En producción debe ser obligatorio.
  }

  const xSignature = request.headers.get('x-signature') ?? '';
  const xRequestId = request.headers.get('x-request-id') ?? '';
  const dataId = new URL(request.url).searchParams.get('data.id') ?? '';

  // Construir el manifest según docs de MP
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1] ?? ''};`;
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const receivedHash = xSignature.split(',').find(p => p.startsWith('v1='))?.split('=')[1] ?? '';

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(receivedHash));
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  // 1. Verificar firma
  if (!verifyMpSignature(request, rawBody)) {
    console.error('[webhook-mp] Firma inválida');
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  let event: { type?: string; data?: { id?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // 2. Solo procesar pagos aprobados
  if (event.type !== 'payment') {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const paymentId = event.data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: 'payment id ausente' }, { status: 400 });
  }

  // 3. Consultar el pago en la API de MP para validar el estado real
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });

  if (!mpRes.ok) {
    console.error('[webhook-mp] No se pudo obtener el pago:', paymentId);
    return NextResponse.json({ error: 'Error consultando pago' }, { status: 502 });
  }

  const payment = await mpRes.json();

  if (payment.status !== 'approved') {
    console.log('[webhook-mp] Pago no aprobado, status:', payment.status);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // 4. Actualizar la transacción en Supabase
  try {
    const supabase = getSupabaseAdmin();
    const externalRef: string = payment.external_reference ?? '';
    const [productSlug] = externalRef.split('|');

    // Buscar la transacción por preference_id o external_reference
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('id')
      .eq('mp_preference_id', payment.order?.id ?? '')
      .single();

    if (txError || !transaction) {
      console.error('[webhook-mp] Transacción no encontrada para payment:', paymentId);
      // No devolvemos error para que MP no reintente infinitamente
      return NextResponse.json({ received: true }, { status: 200 });
    }

    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        mp_payment_id: String(paymentId),
        mp_status_detail: payment.status_detail,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    // 5. Disparar generación del reporte en background
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    fetch(`${appUrl}/api/generate-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: transaction.id, productSlug }),
    }).catch(err => console.error('[webhook-mp] Error disparando reporte:', err));

    // 6. Notificación WhatsApp
    fetch(`${appUrl}/api/notify-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        productSlug,
        payerEmail: payment.payer?.email,
      }),
    }).catch(err => console.error('[webhook-mp] Error notificando WhatsApp:', err));

  } catch (err) {
    console.error('[webhook-mp] Error interno:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
