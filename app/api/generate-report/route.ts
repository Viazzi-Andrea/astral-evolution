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
import {
  generateNatalChartSVG,
  generateSynastryChartSVG,
  svgToDataUrl,
} from '@/lib/astro/chart-svg';

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
    const [chart1, chart2] = await Promise.all([
      computeChart(birthData),
      computeChart(partnerData),
    ]);
    const svg = generateSynastryChartSVG(chart1, birthData.name, chart2, partnerData.name);
    return {
      ...buildSynastryPrompt(chart1, birthData.name, chart2, partnerData.name, birthData.personal_context ?? undefined),
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

    // Subir SVG a Supabase Storage para obtener URL pública (Gmail bloquea data: URLs)
    let chartImageUrl: string | undefined;
    try {
      const chartPath = `charts/${transactionId}.svg`;
      await supabase.storage.from('charts').upload(chartPath, Buffer.from(svg, 'utf-8'), {
        contentType: 'image/svg+xml',
        upsert: true,
      });
      const { data: urlData } = supabase.storage.from('charts').getPublicUrl(chartPath);
      chartImageUrl = urlData.publicUrl;
      console.log(`[GenerateReport] Chart SVG subido: ${chartImageUrl}`);
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
  // Normalizar saltos de línea (Windows \r\n → \n)
  let t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Encabezados (antes de cualquier otra cosa)
  t = t.replace(/^#{3} (.+)$/gm, '<h3>$1</h3>');
  t = t.replace(/^#{2} (.+)$/gm, '<h2>$1</h2>');
  t = t.replace(/^#{1} (.+)$/gm, '<h1>$1</h1>');

  // Negrita e itálica
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g,     '<em>$1</em>');

  // Listas: acumular <li> consecutivos y envolver en <ul>
  t = t.replace(/^[·•\-\*] (.+)$/gm, '<li>$1</li>');
  t = t.replace(/(<li>[^\n]+<\/li>\n?)+/g, match => `<ul>${match}</ul>`);

  // Separadores
  t = t.replace(/^---+$/gm, '<hr>');

  // Párrafos: líneas no vacías que no empiezan con etiqueta HTML
  t = t.replace(/^(?!<\/?(h[1-6]|ul|li|hr|p|strong|em)[ >])(.+)$/gm, '<p>$2</p>');

  // Limpiar líneas vacías múltiples
  t = t.replace(/\n{3,}/g, '\n\n');

  return t.trim();
}
