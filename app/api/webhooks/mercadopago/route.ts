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

  if (!rawBody || rawBody.trim() === '' || rawBody.trim() === '{}') {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let event: { type?: string; data?: { id?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (event.type !== 'payment' || !event.data?.id) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const paymentId = event.data.id;

  try {
    await processPayment(paymentId);
  } catch (err) {
    console.error('[webhook-mp] Error procesando pago:', err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function processPayment(paymentId: string) {
  console.log('[webhook-mp] Procesando pago:', paymentId);

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });

  if (!mpRes.ok) {
    console.error('[webhook-mp] No se pudo obtener el pago:', paymentId);
    return;
  }

  const payment = await mpRes.json();
  console.log('[webhook-mp] Estado:', payment.status);

  if (payment.status !== 'approved') {
    console.log('[webhook-mp] Pago no aprobado, ignorando');
    return;
  }

  // Usar metadata que guardamos al crear la preferencia
  const meta = payment.metadata ?? {};
  const userId      = meta.user_id ?? '';
  const birthDataId = meta.birth_data_id ?? '';
  const productId   = meta.product_id ?? '';
  const productSlug = meta.product_slug ?? 'lectura-esencial';

  console.log('[webhook-mp] metadata:', JSON.stringify(meta));

  if (!userId || !birthDataId) {
    console.error('[webhook-mp] metadata incompleto — no se puede procesar');
    return;
  }

  const supabase = getSupabaseAdmin();

  // Upsert — si ya existe por mp_payment_id la actualiza, si no la crea
  let transactionId: string;

  const { data: existingTx } = await supabase
    .from('transactions')
    .select('id')
    .eq('mp_payment_id', String(paymentId))
    .maybeSingle();

  if (existingTx) {
    transactionId = existingTx.id;
    console.log('[webhook-mp] Transacción existente:', transactionId);
  } else {
    const { data: newTx, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id:          userId,
        product_id:       productId || null,
        birth_data_id:    birthDataId,
        mp_payment_id:    String(paymentId),
        amount:           payment.transaction_amount,
        currency:         payment.currency_id,
        country_code:     meta.country_code ?? 'UY',
        status:           'completed',
        completed_at:     new Date().toISOString(),
        mp_status_detail: payment.status_detail,
      })
      .select('id')
      .single();

    if (txError || !newTx) {
      console.error('[webhook-mp] Error creando transacción:', txError?.message);
      return;
    }
    transactionId = newTx.id;
    console.log('[webhook-mp] ✅ Transacción creada:', transactionId);
  }

  // Actualizar a completed siempre
  await supabase
    .from('transactions')
    .update({
      status:           'completed',
      mp_payment_id:    String(paymentId),
      mp_status_detail: payment.status_detail,
      completed_at:     new Date().toISOString(),
    })
    .eq('id', transactionId);

  console.log('[webhook-mp] ✅ Transacción actualizada a completed');

  // Obtener datos de nacimiento
  const { data: birthData } = await supabase
    .from('birth_data')
    .select('*')
    .eq('id', birthDataId)
    .single();

  if (!birthData) {
    console.error('[webhook-mp] No se encontraron datos de nacimiento');
    return;
  }

  // Generar reporte con Gemini
  await generateReport(supabase, transactionId, productSlug, birthData);

  // Notificar WhatsApp
  await notifyWhatsApp(payment, productSlug);
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

  console.log('[webhook-mp] Generando reporte con Gemini...');

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(productSlug, birthData) }] }],
        generationConfig: { temperature: 0.75, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!geminiRes.ok) {
    console.error('[webhook-mp] Error Gemini:', geminiRes.status);
    return;
  }

  const geminiData = await geminiRes.json();
  const reportText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!reportText) {
    console.error('[webhook-mp] Gemini devolvió respuesta vacía');
    return;
  }

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

  console.log('[webhook-mp] ✅ Reporte generado:', transactionId);
}

async function notifyWhatsApp(payment: Record<string, unknown>, productSlug: string) {
  const accountSid = process.env.WHATSAPP_ACCOUNT_SID;
  const authToken  = process.env.WHATSAPP_AUTH_TOKEN;
  const fromNumber = process.env.WHATSAPP_FROM_NUMBER;
  const toNumber   = process.env.WHATSAPP_NOTIFY_NUMBER;

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    console.warn('[webhook-mp] WhatsApp no configurado');
    return;
  }

  const message = `✨ Nueva venta en Astral Evolution!\n\nProducto: ${productSlug}\nMonto: ${payment.transaction_amount} ${payment.currency_id}\nCliente: ${(payment.payer as Record<string, string>)?.email}`;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: fromNumber, To: toNumber, Body: message }).toString(),
    }
  );

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
Incluye: análisis de Sol, Luna y Ascendente, tránsitos del mes actual, recomendaciones prácticas.
Escribe en español, tono cálido y profesional. Mínimo 500 palabras.`,
    'consulta-evolutiva': `Eres un astrólogo evolutivo. Genera un dossier astrológico completo para:
${base}
Incluye: carta natal completa, aspectos planetarios, tránsitos del año, nodos lunares, plan de crecimiento.
Escribe en español, tono profundo. Mínimo 1500 palabras.`,
    'especial-parejas': `Eres astrólogo especialista en relaciones. Genera análisis de sinastría para:
${base}
Incluye: compatibilidad, fortalezas, desafíos, recomendaciones para armonizar.
Escribe en español. Mínimo 1200 palabras.`,
  };

  return prompts[slug] ?? prompts['lectura-esencial'];
}
