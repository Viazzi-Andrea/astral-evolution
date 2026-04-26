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
import type { BirthInput } from '@/lib/astro/ephemeris';
import { geocodeCity, toUTCTime } from '@/lib/astro/geocode';
import {
  buildEssentialReadingPrompt,
  buildEvolutionaryConsultationPrompt,
  buildSynastryPrompt,
} from '@/lib/astro/prompts';
import {
  generateNatalChartSVG,
  generateSynastryChartSVG,
} from '@/lib/astro/chart-svg';
import {
  computeCompositePoints,
  computeDraconicPoints,
  computeDavisonChart,
  computeProgressedChart,
  computeCurrentTransits,
  getPartileAspects,
  getTransitsOnComposite,
  formatCompositeForPrompt,
  formatProgressedForPrompt,
  formatTransitsForPrompt,
  formatDraconicKeyPoints,
} from '@/lib/astro/synastry-charts';

// ─── Geocodifica y calcula carta natal ────────────────────────────────────────
async function computeChart(birth: {
  birth_date: string;
  birth_time: string;
  birth_city: string;
  birth_country: string;
}) {
  const geo = await geocodeCity(birth.birth_city, birth.birth_country);
  const utc = toUTCTime(birth.birth_date, birth.birth_time, geo.tzName);
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

/** Calcula carta natal y devuelve también el BirthInput (para cartas avanzadas). */
async function computeChartFull(birth: {
  birth_date: string;
  birth_time: string;
  birth_city: string;
  birth_country: string;
}) {
  const geo = await geocodeCity(birth.birth_city, birth.birth_country);
  const utc = toUTCTime(birth.birth_date, birth.birth_time, geo.tzName);
  const input: BirthInput = {
    year:      utc.year,
    month:     utc.month,
    day:       utc.day,
    hour:      utc.hour,
    minute:    utc.minute,
    latitude:  geo.latitude,
    longitude: geo.longitude,
  };
  return { chart: calculateNatalChart(input), input };
}

// ─── Selecciona el prompt y genera SVG ───────────────────────────────────────
async function buildPromptAndChart(
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
): Promise<{ systemInstruction: string; userPrompt: string; svg: string }> {

  if (productSlug === 'especial-parejas' && partnerData) {
    const [result1, result2] = await Promise.all([
      computeChartFull(birthData),
      computeChartFull(partnerData),
    ]);
    const { chart: chart1, input: input1 } = result1;
    const { chart: chart2, input: input2 } = result2;

    // Cartas avanzadas
    const now        = new Date();
    const todayY     = now.getUTCFullYear();
    const todayM     = now.getUTCMonth() + 1;
    const todayD     = now.getUTCDate();

    const composite     = computeCompositePoints(chart1, chart2);
    const draconic1     = computeDraconicPoints(chart1);
    const draconic2     = computeDraconicPoints(chart2);
    const davisonChart  = computeDavisonChart(input1, input2);
    const progressed1   = computeProgressedChart(input1, todayY, todayM, todayD);
    const progressed2   = computeProgressedChart(input2, todayY, todayM, todayD);
    const transits      = computeCurrentTransits();
    const partileAspects   = getPartileAspects(chart1, chart2);
    const transitAspects   = getTransitsOnComposite(composite, transits);

    const svg = generateSynastryChartSVG(chart1, birthData.name, chart2, partnerData.name);
    return {
      ...buildSynastryPrompt(chart1, birthData.name, chart2, partnerData.name, {
        composite,
        draconic1,
        draconic2,
        davisonChart,
        progressed1,
        progressed2,
        transits,
        partileAspects,
        transitAspects,
        personalContext: birthData.personal_context ?? undefined,
      }),
      svg,
    };
  }

  const chart = await computeChart(birthData);
  const context = birthData.personal_context ?? undefined;
  const svg = generateNatalChartSVG(chart, birthData.name);

  if (productSlug === 'consulta-evolutiva') {
    return { ...buildEvolutionaryConsultationPrompt(chart, birthData.name, context), svg };
  }

  return { ...buildEssentialReadingPrompt(chart, birthData.name, context), svg };
}

// ─── Groq (OpenAI-compatible) ─────────────────────────────────────────────────
async function tryGroq(systemInstruction: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY?.replace(/[\r\n\s]/g, '');
  if (!apiKey) return null;

  const models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
  ];

  for (let i = 0; i < models.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 800));

    const model = models[i];
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens:  8000,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        console.log(`[GenerateReport] Groq OK — modelo: ${model}`);
        return text;
      }
    }

    const status = res.status;
    console.warn(`[GenerateReport] Groq ${model} falló (${status})`);
    if (status !== 503 && status !== 429 && status !== 413 && status !== 400) break;
  }

  return null;
}

// ─── Gemini fallback ──────────────────────────────────────────────────────────
async function tryGemini(systemInstruction: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/[\r\n\s]/g, '');
  if (!apiKey) return null;

  // gemini-2.5-flash first: supports up to 65k output tokens (eliminates truncation)
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

  for (const model of models) {
    const maxOutputTokens = model === 'gemini-2.5-flash' ? 16000 : 8192;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }],
        generationConfig: { maxOutputTokens, temperature: 0.8 },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`[GenerateReport] Gemini OK — modelo: ${model}`);
        return text;
      }
      // Respuesta OK pero sin texto — loguear estructura
      console.warn(`[GenerateReport] Gemini ${model} sin texto — finishReason: ${data?.candidates?.[0]?.finishReason}`);
    } else {
      const errBody = await res.text().catch(() => '(sin body)');
      console.warn(`[GenerateReport] Gemini ${model} falló (${res.status}): ${errBody.slice(0, 300)}`);
    }
  }

  return null;
}

// ─── Mistral fallback (OpenAI-compatible, tier gratuito) ─────────────────────
async function tryMistral(systemInstruction: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.MISTRAL_API_KEY?.replace(/[\r\n\s]/g, '');
  if (!apiKey) return null;

  const models = ['mistral-small-latest', 'open-mistral-nemo'];

  for (const model of models) {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens:  8000,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        console.log(`[GenerateReport] Mistral OK — modelo: ${model}`);
        return text;
      }
    }
    console.warn(`[GenerateReport] Mistral ${model} falló (${res.status})`);
  }
  return null;
}

// ─── Orquestador: Groq → Gemini → Mistral ────────────────────────────────────
async function callAI(systemInstruction: string, userPrompt: string): Promise<string> {
  const text = await tryGroq(systemInstruction, userPrompt)
            ?? await tryGemini(systemInstruction, userPrompt)
            ?? await tryMistral(systemInstruction, userPrompt);

  if (!text) throw new Error('Servicio de cálculo no disponible, intentá en unos minutos');
  return text;
}

// ─── Vercel function config ───────────────────────────────────────────────────
export const maxDuration = 300;

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

  // Idempotencia atómica: solo proceder si el reporte está en 'pending' o 'failed'
  // Si ya está 'generating' o 'completed', otro proceso lo tomó — retornar sin error
  const { data: claimed } = await supabase
    .from('reports')
    .update({ status: 'generating' })
    .eq('transaction_id', transactionId)
    .in('status', ['pending', 'failed'])
    .select('id')
    .maybeSingle();

  if (!claimed) {
    const { data: current } = await supabase
      .from('reports')
      .select('status')
      .eq('transaction_id', transactionId)
      .maybeSingle();
    return NextResponse.json({ success: true, status: current?.status ?? 'processing' });
  }

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

    // Calcular efemérides reales, construir prompt y generar SVG
    const { systemInstruction, userPrompt, svg } = await buildPromptAndChart(productSlug, birthData, partnerData);

    // Convertir SVG → PNG y subir a Supabase Storage (Gmail bloquea SVG en <img>)
    let chartImageUrl: string | undefined;
    try {
      const { Resvg } = await import('@resvg/resvg-js');
      const resvg     = new Resvg(svg, { background: 'rgba(10,6,24,1)', fitTo: { mode: 'width', value: 480 } });
      const pngBuffer = resvg.render().asPng();
      const chartPath = `charts/${transactionId}.png`;
      await supabase.storage.from('charts').upload(chartPath, pngBuffer, {
        contentType: 'image/png',
        upsert: true,
      });
      const { data: urlData } = supabase.storage.from('charts').getPublicUrl(chartPath);
      chartImageUrl = urlData.publicUrl;
      console.log(`[GenerateReport] Chart PNG subido: ${chartImageUrl}`);
    } catch (chartErr) {
      console.warn('[GenerateReport] ⚠️ Chart upload falló, se omite imagen en email:', chartErr);
    }

    console.log(`[GenerateReport] Llamando a Groq para ${productSlug}...`);
    const rawText = await callAI(systemInstruction, userPrompt);

    console.log(`[GenerateReport] Raw output (primeros 200 chars): ${rawText.slice(0, 200)}`);

    // Guardar markdown puro sanitizado (sin convertir a HTML)
    // La conversión a HTML ocurre solo al generar el email
    const sanitizedText = sanitizeAIOutput(rawText);

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
        const htmlForEmail = markdownToHTML(sanitizedText);
        await sendReportEmail({
          to:           userEmail,
          userName,
          productName,
          reportHTML:   htmlForEmail,
          chartDataUrl: chartImageUrl,
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
  let t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Encabezados — ## crea tarjeta nueva, ### se convierte a negrita para uniformidad visual
  t = t.replace(/^#{3} (.+)$/gm, '**$1**');
  t = t.replace(/^#{2} (.+)$/gm, '<h2>$1</h2>');
  t = t.replace(/^#{1} (.+)$/gm, '<h1>$1</h1>');

  // Negrita e itálica
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g,     '<em>$1</em>');

  // Listas con viñeta (·•-*)
  t = t.replace(/^[·•\-\*] (.+)$/gm, '<li>$1</li>');

  // Listas numeradas (1. 2. 3.)
  t = t.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Envolver bloques de <li> consecutivos en <ul>
  t = t.replace(/(<li>[^\n]+<\/li>\n?)+/g, match => `<ul>${match}</ul>`);

  // Separadores
  t = t.replace(/^---+$/gm, '<hr>');

  // Párrafos: líneas no vacías que no empiezan con etiqueta HTML
  t = t.replace(/^(?!<\/?(h[1-6]|ul|li|hr|p|strong|em)[ >])(.+)$/gm, '<p>$2</p>');

  // Limpiar líneas vacías múltiples
  t = t.replace(/\n{3,}/g, '\n\n');

  return t.trim();
}
