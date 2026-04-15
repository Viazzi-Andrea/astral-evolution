/**
 * app/api/generate-report/route.ts
 * Generación de reporte con Gemini 1.5 Flash + envío automático por email.
 * Versión completa: genera → sanitiza → guarda en DB → envía email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GenerateReportSchema, sanitizeAIOutput } from '@/lib/validations/schemas';
import { sendReportEmail } from '@/lib/email/send-report';

// ─── Prompts por producto ─────────────────────────────────────────────────────
function buildPrompt(
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
): string {
  const mes = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  const base = `
Nombre: ${birthData.name}
Fecha de nacimiento: ${birthData.birth_date}
Hora de nacimiento: ${birthData.birth_time}
Ciudad: ${birthData.birth_city}, ${birthData.birth_country}
${birthData.personal_context ? `Contexto personal: ${birthData.personal_context}` : ''}
  `.trim();

  if (productSlug === 'lectura-esencial') {
    return `Eres un astrólogo profesional experto en astrología evolutiva. Genera una Lectura Esencial personalizada para:

${base}

Incluye:
**Sol, Luna y Ascendente** — Las tres luminarias principales y su expresión en la personalidad.
**Tránsitos de ${mes}** — Qué energías están activas y cómo aprovecharlas.
**3 Recomendaciones concretas** — Acciones específicas alineadas con la energía actual.

Extensión: 4-6 párrafos bien desarrollados. Usa **negritas** para los títulos de sección. No uses HTML ni markdown complejo. Tono: profundo, inspirador y accesible.`;
  }

  if (productSlug === 'consulta-evolutiva') {
    return `Eres un astrólogo profesional experto en astrología evolutiva y karmica. Genera una Consulta Evolutiva completa para:

${base}

Incluye:
**Carta Natal** — Sol, Luna, Ascendente y planetas personales (Mercurio, Venus, Marte, Júpiter, Saturno).
**Las Casas Clave** — Las 3-4 casas más activadas y su mensaje evolutivo.
**Aspectos Planetarios Principales** — Las configuraciones más significativas.
**Nodos Lunares** — Nodo Norte (misión del alma) y Nodo Sur (karma a soltar).
**Quirón** — La herida primordial y el camino de sanación.
**Tránsitos Importantes del Año** — Saturno, Júpiter y planetas lentos.
**Revolución Solar** — El foco del año en curso.
**Plan de Crecimiento** — 5 áreas de trabajo y recomendaciones específicas.

Extensión: 12-15 párrafos profundos. Usa **negritas** para los títulos. Tono: transformador y evolutivo.`;
  }

  if (productSlug === 'especial-parejas' && partnerData) {
    return `Eres un astrólogo especializado en sinastría y astrología relacional. Genera un Especial Parejas para:

**PERSONA 1:**
${base}

**PERSONA 2:**
Nombre: ${partnerData.name}
Fecha: ${partnerData.birth_date}
Hora: ${partnerData.birth_time}
Ciudad: ${partnerData.birth_city}, ${partnerData.birth_country}

Incluye:
**Compatibilidad Esencial** — Sol, Luna y Ascendente de ambos y su dinámica.
**Sinastría** — Los 5-7 aspectos interplanetarios más significativos.
**Casas Activadas** — Qué activa cada uno en la carta del otro.
**Fortalezas de la Pareja** — Los 3 mayores dones compartidos.
**Desafíos y Crecimiento** — 3 áreas de fricción y cómo trabajarlas conscientemente.
**Propósito Conjunto** — La misión evolutiva de esta relación.
**5 Prácticas Recomendadas** — Acciones concretas para fortalecer el vínculo.

Extensión: 14-18 párrafos. Usa **negritas** para títulos. Tono: revelador, compasivo y orientado al crecimiento.`;
  }

  return `Genera un análisis astrológico personalizado para ${birthData.name}, nacido/a el ${birthData.birth_date} a las ${birthData.birth_time} en ${birthData.birth_city}, ${birthData.birth_country}. Sé profundo y evolutivo.`;
}

// ─── Llamada a Gemini con limpieza de key ─────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  // Limpia saltos de línea invisibles — bug conocido con echo en Vercel CLI
  const apiKey = process.env.GEMINI_API_KEY?.replace(/[\r\n\s]/g, '');
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no retornó texto');
  return text;
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

  // Marcar como "generating"
  await supabase
    .from('reports')
    .update({ status: 'generating' })
    .eq('transaction_id', transactionId);

  try {
    // Obtener transacción con todos los datos necesarios
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
      throw new Error(`Transacción no encontrada o no completada`);
    }

    const productSlug = (tx as any).products?.slug;
    const productName = (tx as any).products?.name_es ?? 'Lectura Astrológica';
    const birthData = (tx as any).birth_data;
    const partnerData = (tx as any).partner_birth_data ?? null;
    const userEmail = (tx as any).users?.email;
    const userName = (tx as any).users?.name ?? birthData?.name;

    if (!birthData) throw new Error('Datos de nacimiento no encontrados');

    // Generar reporte con Gemini
    const prompt = buildPrompt(productSlug, birthData, partnerData);
    const rawText = await callGemini(prompt);

    // Sanitizar ANTES de guardar
    const sanitizedText = sanitizeAIOutput(rawText);

    // Guardar en DB
    await supabase
      .from('reports')
      .update({
        status: 'completed',
        ai_response: sanitizedText,
        generated_at: new Date().toISOString(),
      })
      .eq('transaction_id', transactionId);

    console.log(`[GenerateReport] ✅ Reporte generado para ${transactionId}`);

    // Enviar email si tenemos la dirección
    if (userEmail) {
      const emailResult = await sendReportEmail({
        toEmail: userEmail,
        toName: userName,
        productName,
        reportContent: sanitizedText,
        transactionId,
      });

      if (emailResult.success) {
        // Marcar como enviado
        await supabase
          .from('reports')
          .update({ sent_at: new Date().toISOString() })
          .eq('transaction_id', transactionId);
        console.log(`[GenerateReport] ✅ Email enviado a ${userEmail}`);
      } else {
        console.error(`[GenerateReport] ⚠️ Email falló:`, emailResult.error);
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
