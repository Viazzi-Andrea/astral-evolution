/**
 * POST /api/webhooks/mercadopago
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  // Body vacío = simulación de MP, responder 200 inmediatamente
  if (!rawBody || rawBody.trim() === '' || rawBody.trim() === '{}') {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let event: { type?: string; data?: { id?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // Responder 200 inmediatamente para evitar timeout de MP
  // Todo el procesamiento va en background
  if (event.type !== 'payment' || !event.data?.id) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const paymentId = event.data.id;

  // Procesar en background — no bloqueamos la respuesta
  processPayment(paymentId).catch(err =>
    console.error('[webhook-mp] Error en background:', err)
  );

  return NextResponse.json({ received: true }, { status: 200 });
}

async function processPayment(paymentId: string) {
  console.log('[webhook-mp] Procesando pago:', paymentId);

  // 1. Consultar el pago en MP
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });

  if (!mpRes.ok) {
    console.error('[webhook-mp] No se pudo obtener el pago:', paymentId);
    return;
  }

  const payment = await mpRes.json();
  console.log('[webhook-mp] Estado del pago:', payment.status);

  if (payment.status !== 'approved') {
    console.log('[webhook-mp] Pago no aprobado, ignorando');
    return;
  }

  // 2. Buscar la transacción por preference_id
  const supabase = getSupabaseAdmin();
  const preferenceId: string = payment.preference_id ?? '';

  console.log('[webhook-mp] Buscando transacción con preference_id:', preferenceId);

  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('id, birth_data_id, product_id')
    .eq('mp_preference_id', preferenceId)
    .maybeSingle();

  if (txError || !transaction) {
    console.error('[webhook-mp] Transacción no encontrada. preference_id:', preferenceId);
    return;
  }

  console.log('[webhook-mp] Transacción encontrada:', transaction.id);

  // 3. Actualizar transacción a completed
  await supabase
    .from('transactions')
    .update({
      status:           'completed',
      mp_payment_id:    String(paymentId),
      mp_status_detail: payment.status_detail,
      completed_at:     new Date().toISOString(),
    })
    .eq('id', transaction.id);

  console.log('[webhook-mp] ✅ Transacción actualizada a completed');

  // 4. Obtener datos de nacimiento
  const { data: birthData } = await supabase
    .from('birth_data')
    .select('*')
    .eq('id', transaction.birth_data_id)
    .single();

  if (!birthData) {
    console.error('[webhook-mp] No se encontraron datos de nacimiento');
    return;
  }

  // 5. Obtener slug del producto
  const { data: product } = await supabase
    .from('products')
    .select('slug')
    .eq('id', transaction.product_id)
    .single();

  const productSlug = product?.slug ?? 'lectura-esencial';

  // 6. Generar reporte con Gemini
  await generateReport(supabase, transaction.id, productSlug, birthData);

  // 7. Notificar WhatsApp
  notifyWhatsApp(payment, productSlug).catch(err =>
    console.error('[webhook-mp] Error WhatsApp:', err)
  );
}

async function generateReport(
  supabase: any,
  transactionId: string,
  productSlug: string,
  birthData: Record<string, string>
) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error('[webhook-mp] GEMINI_API_KEY no configurada');
    return;
  }

  const prompt = buildPrompt(productSlug, birthData);

  console.log('[webhook-mp] Generando reporte con Gemini...');

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.75, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!geminiRes.ok) {
    console.error('[webhook-mp] Error Gemini:', geminiRes.status);
    return;
  }

  const geminiData = await geminiRes.json();
  const reportText: string =
    geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!reportText) {
    console.error('[webhook-mp] Gemini devolvió respuesta vacía');
    return;
  }

  // Sanitizar output
  const sanitized = reportText
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');

  await supabase
    .from('transactions')
    .update({
      report_text:         sanitized,
      report_generated_at: new Date().toISOString(),
    })
    .eq('id', transactionId);

  console.log('[webhook-mp] ✅ Reporte generado y guardado para transacción:', transactionId);
}

async function notifyWhatsApp(payment: Record<string, unknown>, productSlug: string) {
  const accountSid  = process.env.WHATSAPP_ACCOUNT_SID;
  const authToken   = process.env.WHATSAPP_AUTH_TOKEN;
  const fromNumber  = process.env.WHATSAPP_FROM_NUMBER;
  const toNumber    = process.env.WHATSAPP_NOTIFY_NUMBER;

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    console.warn('[webhook-mp] WhatsApp no configurado');
    return;
  }

  const message = `✨ Nueva venta en Astral Evolution!\n\nProducto: ${productSlug}\nMonto: ${payment.transaction_amount} ${payment.currency_id}\nCliente: ${(payment.payer as Record<string, string>)?.email}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: fromNumber,
    To:   toNumber,
    Body: message,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (res.ok) {
    console.log('[webhook-mp] ✅ WhatsApp enviado');
  } else {
    console.error('[webhook-mp] Error WhatsApp:', await res.text());
  }
}

function buildPrompt(slug: string, bd: Record<string, string>): string {
  const base = `Nombre: ${bd.name}
Fecha de nacimiento: ${bd.birth_date}
Hora de nacimiento: ${bd.birth_time}
Ciudad: ${bd.birth_city}, ${bd.birth_country}
${bd.personal_context ? `Contexto personal: ${bd.personal_context}` : ''}`;

  const prompts: Record<string, string> = {
    'lectura-esencial': `Eres un astrólogo profesional. Genera una lectura astrológica esencial para:
${base}

Incluye:
1. Análisis del Sol, Luna y Ascendente
2. Tránsitos planetarios del mes actual
3. Energías disponibles y recomendaciones prácticas

Escribe en español, tono cálido y profesional. Mínimo 500 palabras.`,

    'consulta-evolutiva': `Eres un astrólogo evolutivo. Genera un dossier astrológico completo para:
${base}

Incluye:
1. Carta natal completa (todos los planetas y casas)
2. Aspectos planetarios y significado evolutivo
3. Tránsitos importantes del año
4. Nodos lunares y propósito kármico
5. Plan de crecimiento personalizado

Escribe en español, tono profundo. Mínimo 1500 palabras.`,

    'especial-parejas': `Eres un astrólogo especialista en relaciones. Genera un análisis de sinastría completo.
${base}

Incluye:
1. Sinastría completa entre ambas cartas
2. Compatibilidad de Sol, Luna y Ascendente
3. Fortalezas y desafíos de la relación
4. Recomendaciones para armonizar

Escribe en español. Mínimo 1200 palabras.`,
  };

  return prompts[slug] ?? prompts['lectura-esencial'];
}
