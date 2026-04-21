/**
 * app/api/generate-report/route.ts
 * GeneraciÃ³n de reporte con Gemini 1.5 Flash + envÃ­o automÃ¡tico por email.
 * VersiÃ³n completa: genera â†’ sanitiza â†’ guarda en DB â†’ envÃ­a email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GenerateReportSchema, sanitizeAIOutput } from '@/lib/validations/schemas';
import { sendReportEmail } from '@/lib/email/send-report';


// â”€â”€â”€ Prompts por producto â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  const contexto = birthData.personal_context
    ? `\n\nCONTEXTO PERSONAL (MUY IMPORTANTE — toda la interpretación debe responder a esto): "${birthData.personal_context}"`
    : '';

  const base = `
Nombre: ${birthData.name}
Fecha de nacimiento: ${birthData.birth_date}
Hora de nacimiento: ${birthData.birth_time}
Ciudad: ${birthData.birth_city}, ${birthData.birth_country}${contexto}
  `.trim();

  if (productSlug === 'lectura-esencial') {
    return `Eres un astrólogo profesional experto en astrología evolutiva. Genera una Lectura Esencial profunda y completamente personalizada para:

${base}

REGLAS OBLIGATORIAS:
1. Si hay un contexto personal, ES EL EJE DE TODO el análisis. Cada sección debe responder a esa pregunta o situación desde la astrología. No des una lectura genérica.
2. Responde ÚNICAMENTE con HTML válido: <h2> para títulos, <p> para párrafos, <strong> para conceptos clave, <ul><li> para listas. Sin markdown, sin asteriscos.
3. No repitas conceptos entre secciones. Cada sección aporta información nueva.
4. Mínimo 2 párrafos extensos por sección.

<h2>✦ Lo Que Tu Carta Revela Sobre Esta Situación</h2>
Analiza Sol, Luna y Ascendente de ${birthData.name} enfocándote en cómo estas energías se relacionan directamente con lo que está viviendo o preguntando. No describas los signos en abstracto — interprétalos en función de su contexto real.

<h2>✦ Las Energías de ${mes} y Tu Momento Actual</h2>
Qué tránsitos planetarios están activos este mes y cómo impactan específicamente en la situación que atraviesa ${birthData.name}. Oportunidades concretas y momentos clave del mes.

<h2>✦ El Mensaje de Tu Alma</h2>
Desde la astrología evolutiva, qué viene a enseñarle esta situación a ${birthData.name}. Qué parte de sí mismo está siendo invitado/a a integrar, soltar o fortalecer.

<h2>✦ 3 Acciones Concretas Para Este Momento</h2>
Tres pasos específicos, prácticos y alineados con la energía astral actual que ${birthData.name} puede tomar ahora mismo en relación a su situación.

Tono: profundo, cálido y directo. Habla a ${birthData.name} en segunda persona como si fuera una consulta cara a cara.`;
  }

  if (productSlug === 'consulta-evolutiva') {
    return `Eres un astrólogo profesional experto en astrología evolutiva y kármica. Genera una Consulta Evolutiva completa, extensa y profundamente personalizada para:

${base}

REGLAS OBLIGATORIAS:
1. Si hay un contexto personal, TODO el análisis debe iluminar esa situación desde la astrología. Cada sección conecta los planetas con lo que ${birthData.name} está viviendo realmente.
2. Responde ÚNICAMENTE con HTML válido: <h2> para títulos, <p> para párrafos, <strong> para conceptos clave, <ul><li> para listas. Sin markdown, sin asteriscos.
3. No repitas conceptos entre secciones. Cada sección aporta una capa nueva de comprensión.
4. Mínimo 3 párrafos extensos por sección.

<h2>✦ El Mapa de Tu Alma: Sol, Luna y Ascendente</h2>
Interpreta Sol, Luna y Ascendente de ${birthData.name} en relación directa con su situación actual y contexto de vida. Cómo estas tres energías explican sus patrones, fortalezas y desafíos en lo que está viviendo.

<h2>✦ Los Planetas Personales y Tu Historia</h2>
Mercurio (cómo piensa y comunica), Venus (cómo ama y qué valora), Marte (cómo actúa y desea), Júpiter (dónde se expande) y Saturno (sus lecciones kármicas). Todo interpretado en función de su contexto real, no en abstracto.

<h2>✦ Las Casas Activadas: Las Áreas de Tu Vida en Foco</h2>
Las 4 casas más cargadas de energía en la carta de ${birthData.name}. Qué áreas de vida están siendo el escenario principal de su evolución y cómo se relacionan con su situación actual.

<h2>✦ Aspectos Planetarios: Las Tensiones y Dones que Te Forman</h2>
Los 5 aspectos más significativos de su carta. Para cada uno: qué tensión o don crea, cómo se manifiesta en su vida concreta y qué quiere enseñarle.

<h2>✦ Nodos Lunares: La Misión de Tu Alma en Esta Vida</h2>
Nodo Norte: hacia dónde viene a evolucionar en esta encarnación. Nodo Sur: los patrones del pasado que le sostienen pero también lo limitan. Cómo esta dinámica se expresa en lo que está viviendo ahora.

<h2>✦ Quirón: Tu Herida y Tu Mayor Don</h2>
La herida primordial, cómo se ha manifestado en su historia de vida y de qué forma esta situación actual la está tocando. El camino de integración y el poder que emerge de sanar esta herida.

<h2>✦ Los Tránsitos del Año: Las Puertas que Se Abren</h2>
Júpiter, Saturno, Urano, Neptuno y Plutón en tránsito sobre su carta natal. Qué está siendo removido, expandido o consolidado este año y cómo conecta con su momento presente.

<h2>✦ Tu Revolución Solar: El Tema Central de Este Año</h2>
El foco evolutivo del año en curso. Qué está siendo llamado a vivir, integrar o transformar en este ciclo anual y cómo su situación actual encaja en ese arco mayor.

<h2>✦ Tu Plan de Crecimiento: 5 Pasos Concretos</h2>
Cinco acciones específicas, prácticas y alineadas con su carta natal y momento actual. No consejos genéricos — pasos reales que ${birthData.name} puede comenzar ahora.

Tono: transformador, profundo y compasivo. Habla directamente a ${birthData.name} en segunda persona como un guía que lo/la conoce profundamente.`;
  }

  if (productSlug === 'especial-parejas' && partnerData) {
    return `Eres un astrólogo especializado en sinastría y astrología relacional. Genera un Especial Parejas completo, extenso y profundamente personalizado para:

PERSONA 1: ${birthData.name}
${base}

PERSONA 2: ${partnerData.name}
Fecha: ${partnerData.birth_date}
Hora: ${partnerData.birth_time}
Ciudad: ${partnerData.birth_city}, ${partnerData.birth_country}

REGLAS OBLIGATORIAS:
1. Si hay un contexto de relación compartido, TODO el análisis debe responder a esa situación concreta. No des una lectura genérica de compatibilidad — interpreta la sinastría a la luz de lo que están viviendo.
2. Responde ÚNICAMENTE con HTML válido: <h2> para títulos, <p> para párrafos, <strong> para conceptos clave, <ul><li> para listas. Sin markdown, sin asteriscos.
3. No repitas conceptos entre secciones. Cada sección aporta una dimensión nueva.
4. Mínimo 3 párrafos extensos por sección. Menciona a ambos por nombre constantemente.

<h2>✦ La Dinámica Central: Cómo Se Encuentran Sus Almas</h2>
Analiza cómo interactúan los soles, lunas y ascendentes de ${birthData.name} y ${partnerData.name}. Qué se enciende entre ellos, qué se complementa y qué genera fricción. Conecta esta dinámica con lo que están viviendo en su relación.

<h2>✦ Los Aspectos que Definen Este Vínculo</h2>
Los 6-7 aspectos interplanetarios más significativos entre ambas cartas. Para cada uno: qué área de la relación impacta, cómo se vive en el día a día y qué viene a enseñarles.

<h2>✦ Lo que Cada Uno Despierta en el Otro</h2>
Qué casas de ${birthData.name} activa ${partnerData.name} y viceversa. Qué dimensiones de cada uno salen a la luz gracias a este vínculo, tanto lo luminoso como lo desafiante.

<h2>✦ Los Dones y Fortalezas de Esta Unión</h2>
Los 4 mayores recursos de esta pareja. Dónde fluyen con naturalidad, en qué se potencian mutuamente y qué pueden construir juntos que ninguno podría solo.

<h2>✦ Los Desafíos que los Invitan a Crecer</h2>
Las 4 áreas de tensión o fricción más importantes. Por qué aparecen según la sinastría, qué patrón subyacente revelan en cada uno y cómo transformarlas en motor de crecimiento en lugar de fuente de conflicto recurrente.

<h2>✦ El Propósito Kármico de Esta Relación</h2>
Por qué se encontraron estas dos almas. Qué vienen a sanar, aprender o crear juntos. El tema evolutivo central de este vínculo y cómo su situación actual forma parte de ese arco mayor.

<h2>✦ 5 Prácticas Concretas para Honrar Este Vínculo</h2>
Cinco acciones específicas y aplicables para ${birthData.name} y ${partnerData.name}. Que respondan directamente a su situación real y a los patrones identificados en el análisis.

Tono: revelador, compasivo y directo. Habla a ambos en segunda persona del plural y menciónalos por nombre.`;
  }

  return `Genera un análisis astrológico personalizado en HTML para ${birthData.name}, nacido/a el ${birthData.birth_date} a las ${birthData.birth_time} en ${birthData.birth_city}, ${birthData.birth_country}. Sé profundo y evolutivo. Usa etiquetas <h2> y <p>.`;
}

// â”€â”€â”€ Llamada a Groq ─────────────────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.replace(/[\r\n\s]/g, '');
  if (!apiKey) throw new Error('GROQ_API_KEY no configurada');

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

  for (const model of models) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 8192,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Groq no retornó texto');
      return text;
    }

    const err = await res.text();
    if (res.status === 503 || res.status === 429) continue;
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  throw new Error('Groq no disponible, intentá en unos minutos');
}

// â”€â”€â”€ Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invÃ¡lido' }, { status: 400 });
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
    // Obtener transacciÃ³n con todos los datos necesarios
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
      throw new Error(`TransacciÃ³n no encontrada o no completada`);
    }

    const productSlug = (tx as any).products?.slug;
    const productName = (tx as any).products?.name_es ?? 'Lectura AstrolÃ³gica';
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

    console.log(`[GenerateReport] âœ… Reporte generado para ${transactionId}`);

    // Enviar email si tenemos la direcciÃ³n
    if (userEmail) {
      try {
        await sendReportEmail({
          to: userEmail,
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
    console.error('[GenerateReport] âŒ', msg);

    await supabase
      .from('reports')
      .update({ status: 'failed', error_message: msg })
      .eq('transaction_id', transactionId);

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
