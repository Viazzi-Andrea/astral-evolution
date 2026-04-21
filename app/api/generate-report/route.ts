/**
 * app/api/generate-report/route.ts
 * Generación de reporte astrológico con datos astronómicos reales.
 * Pipeline: geocoding → efemérides → prompt profesional → Groq → email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GenerateReportSchema, sanitizeAIOutput } from '@/lib/validations/schemas';
import { sendReportEmail } from '@/lib/email/send-report';
import { calculateNatalChart } from '@/lib/astro/ephemeris';
import { geocodeCity, toUTCTime } from '@/lib/astro/geocode';
import {
  buildEssentialReadingPrompt,
  buildEvolutionaryConsultationPrompt,
  buildSynastryPrompt,
} from '@/lib/astro/prompts';

// ─── Geocodifica y calcula carta natal ────────────────────────────────────────
async function computeChart(birth: {
  birth_date: string;
  birth_time: string;
  birth_city: string;
  birth_country: string;
}) {
  const geo = await geocodeCity(birth.birth_city, birth.birth_country);
  const utc = toUTCTime(birth.birth_date, birth.birth_time, geo.utcOffset);
  return calculateNatalChart({
    year:      utc.year,
    month:     utc.month,
    day:       utc.day,
    hour:      utc.hour,
    minute:    utc.minute,
    latitude:  geo.latitude,
    longitude: geo.longitude,
  });
}

// ─── Selecciona el prompt correcto según el producto ─────────────────────────
async function buildPrompt(
  productSlug: string,
  birthData: {
    name: string;
    birth_date: string;
    birth_time: string;
    birth_city: string;
    birth_country: string;
    personal_context?: string | null;
  },
  partnerData?: {
    name: string;
    birth_date: string;
    birth_time: string;
    birth_city: string;
    birth_country: string;
  } | null
): Promise<{ systemInstruction: string; userPrompt: string }> {

  if (productSlug === 'especial-parejas' && partnerData) {
    const [chart1, chart2] = await Promise.all([
      computeChart(birthData),
      computeChart(partnerData),
    ]);
    return buildSynastryPrompt(chart1, birthData.name, chart2, partnerData.name);
  }

  const chart = await computeChart(birthData);
  const context = birthData.personal_context ?? undefined;

  if (productSlug === 'consulta-evolutiva') {
    return buildEvolutionaryConsultationPrompt(chart, birthData.name, context);
  }

  // lectura-esencial (y cualquier fallback)
  return buildEssentialReadingPrompt(chart, birthData.name, context);
}

// ─── Llamada a Groq ───────────────────────────────────────────────────────────
async function callGroq(systemInstruction: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.replace(/[\r\n\s]/g, '');
  if (!apiKey) throw new Error('GROQ_API_KEY no configurada');

  const models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama3-70b-8192',
    'llama-3.1-8b-instant',
  ];

  for (let i = 0; i < models.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 800));

    const model = models[i];
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens:  4000,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Groq no retornó texto');
      console.log(`[GenerateReport] Modelo usado: ${model}`);
      return text;
    }

    const err = await res.text();
    console.warn(`[GenerateReport] ${model} falló (${res.status}), probando siguiente...`);
    if (res.status === 503 || res.status === 429 || res.status === 413) continue;
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  throw new Error('Groq no disponible, intentá en unos minutos');
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = GenerateReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
  }

  const { transactionId } = parsed.data;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  await supabase
    .from('reports')
    .update({ status: 'generating' })
    .eq('transaction_id', transactionId);

  try {
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select(`
        *,
        products(slug, name_es),
        birth_data!transactions_birth_data_id_fkey(
          name, birth_date, birth_time, birth_city, birth_country, personal_context
        ),
        partner_birth_data:birth_data!transactions_partner_birth_data_id_fkey(
          name, birth_date, birth_time, birth_city, birth_country
        ),
        users(name, email)
      `)
      .eq('id', transactionId)
      .eq('status', 'completed')
      .single();

    if (txError || !tx) {
      throw new Error('Transacción no encontrada o no completada');
    }

    const productSlug = (tx as any).products?.slug;
    const productName = (tx as any).products?.name_es ?? 'Lectura Astrológica';
    const birthData   = (tx as any).birth_data;
    const partnerData = (tx as any).partner_birth_data ?? null;
    const userEmail   = (tx as any).users?.email;
    const userName    = (tx as any).users?.name ?? birthData?.name;

    if (!birthData) throw new Error('Datos de nacimiento no encontrados');

    console.log(`[GenerateReport] Calculando carta natal para ${birthData.name} en ${birthData.birth_city}...`);

    // Calcular efemérides reales y construir prompt profesional
    const { systemInstruction, userPrompt } = await buildPrompt(productSlug, birthData, partnerData);

    console.log(`[GenerateReport] Llamando a Groq para ${productSlug}...`);
    const rawText = await callGroq(systemInstruction, userPrompt);

    // Convertir markdown a HTML si Groq devuelve markdown (los prompts de lib/astro/prompts.ts usan # y ##)
    const htmlText = markdownToHTML(rawText);
    const sanitizedText = sanitizeAIOutput(htmlText);

    await supabase
      .from('reports')
      .update({
        status:       'completed',
        ai_response:  sanitizedText,
        generated_at: new Date().toISOString(),
      })
      .eq('transaction_id', transactionId);

    console.log(`[GenerateReport] ✅ Reporte generado para ${transactionId}`);

    if (userEmail) {
      try {
        await sendReportEmail({
          to:         userEmail,
          userName,
          productName,
          reportHTML: sanitizedText,
        });
        await supabase
          .from('reports')
          .update({ sent_at: new Date().toISOString() })
          .eq('transaction_id', transactionId);
        console.log(`[GenerateReport] ✅ Email enviado a ${userEmail}`);
      } catch (emailErr) {
        console.error('[GenerateReport] ⚠️ Email falló:', emailErr);
      }
    }

    return NextResponse.json({ success: true, transactionId });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[GenerateReport] ❌', msg);

    await supabase
      .from('reports')
      .update({ status: 'failed', error_message: msg })
      .eq('transaction_id', transactionId);

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── Convierte markdown básico a HTML ────────────────────────────────────────
function markdownToHTML(text: string): string {
  return text
    // Encabezados
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Negrita e itálica
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    // Listas
    .replace(/^[·•\-] (.+)$/gm, '<li>$1</li>')
    // Párrafos: líneas que no son etiquetas ni listas
    .replace(/^(?!<[a-z]|---|\s*$)(.+)$/gm, '<p>$1</p>')
    // Envolver listas sueltas de <li>
    .replace(/(<li>[\s\S]+?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>')
    // Separadores
    .replace(/^---$/gm, '<hr>')
    // Limpiar líneas vacías múltiples
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
