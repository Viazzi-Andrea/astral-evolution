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

  const base = `
Nombre: ${birthData.name}
Fecha de nacimiento: ${birthData.birth_date}
Hora de nacimiento: ${birthData.birth_time}
Ciudad: ${birthData.birth_city}, ${birthData.birth_country}
${birthData.personal_context ? `Contexto personal: ${birthData.personal_context}` : ''}
  `.trim();

  if (productSlug === 'lectura-esencial') {
    return `Eres un astrólogo profesional experto en astrología evolutiva. Genera una Lectura Esencial personalizada y profunda para:

${base}

IMPORTANTE: Responde ÚNICAMENTE con HTML válido. Usa estas etiquetas: <h2> para títulos de sección, <p> para párrafos, <strong> para conceptos clave, <ul><li> para listas. Sin markdown, sin asteriscos, sin texto plano fuera de etiquetas HTML.

Estructura obligatoria (cada sección debe tener mínimo 2 párrafos extensos):

<h2>✦ Tu Sol, Luna y Ascendente</h2>
Analiza en profundidad el signo solar y lo que revela sobre la identidad central de ${birthData.name}. Explica la Luna y su mundo emocional, necesidades afectivas y patrones inconscientes. Describe el Ascendente y cómo se proyecta al mundo. Relaciona las tres energías entre sí.

<h2>✦ Tránsitos de ${mes}</h2>
Describe las energías planetarias activas este mes para esta carta natal. Qué planetas están en movimiento importante, qué áreas de vida están siendo activadas, qué oportunidades y desafíos se presentan. Sé específico con las fechas o períodos más relevantes del mes.

<h2>✦ Tu Mensaje del Momento</h2>
Un mensaje profundo y personal sobre el momento evolutivo que atraviesa ${birthData.name}. Qué está siendo llamado a integrar, soltar o manifestar.

<h2>✦ 3 Recomendaciones Concretas para Este Mes</h2>
Lista con tres acciones específicas, prácticas y alineadas con la energía astral actual. Que sean aplicables en la vida cotidiana.

Tono: profundo, cálido, inspirador y accesible. Evita tecnicismos sin explicación. Habla directamente a ${birthData.name} en segunda persona.`;
  }

  if (productSlug === 'consulta-evolutiva') {
    return `Eres un astrólogo profesional experto en astrología evolutiva y kármica. Genera una Consulta Evolutiva completa, extensa y profunda para:

${base}

IMPORTANTE: Responde ÚNICAMENTE con HTML válido. Usa estas etiquetas: <h2> para títulos de sección, <p> para párrafos, <strong> para conceptos clave, <ul><li> para listas. Sin markdown, sin asteriscos.

Estructura obligatoria (cada sección debe ser extensa, mínimo 3 párrafos):

<h2>✦ Tu Carta Natal: El Mapa de Tu Alma</h2>
Analiza Sol, Luna y Ascendente en profundidad. Luego describe Mercurio (mente y comunicación), Venus (amor y valores), Marte (acción y deseo), Júpiter (expansión y abundancia) y Saturno (estructura y karma) con sus signos y casas.

<h2>✦ Las Casas Más Activadas en Tu Carta</h2>
Identifica las 4 casas más cargadas de energía y explica qué áreas de vida están siendo el foco principal de la evolución de ${birthData.name}.

<h2>✦ Aspectos Planetarios Que Te Definen</h2>
Los 4-5 aspectos más significativos (conjunciones, cuadraturas, trígonos, oposiciones) y cómo moldean la personalidad y el destino.

<h2>✦ Tus Nodos Lunares: La Misión del Alma</h2>
Nodo Norte: la dirección hacia donde el alma viene a evolucionar en esta vida. Nodo Sur: los talentos del pasado y lo que hay que soltar. Cómo integrar ambas energías.

<h2>✦ Quirón: La Herida que Sana</h2>
La herida primordial de ${birthData.name}, cómo se manifiesta en su vida y el camino de sanación y transformación que ofrece.

<h2>✦ Tránsitos Importantes del Año</h2>
Saturno, Júpiter, Urano, Neptuno y Plutón: qué están activando en la carta natal este año. Períodos clave, desafíos y oportunidades mayores.

<h2>✦ Tu Revolución Solar: El Año en Curso</h2>
El foco temático del año de vida actual. Qué áreas están siendo iluminadas y cuál es la invitación evolutiva principal.

<h2>✦ Plan de Crecimiento Personal</h2>
5 áreas concretas de trabajo con recomendaciones específicas y prácticas para cada una. Que sean aplicables en la vida real de ${birthData.name}.

Tono: transformador, profundo y compasivo. Habla directamente a ${birthData.name} en segunda persona.`;
  }

  if (productSlug === 'especial-parejas' && partnerData) {
    return `Eres un astrólogo especializado en sinastría y astrología relacional. Genera un Especial Parejas completo, extenso y revelador para:

PERSONA 1: ${birthData.name}
${base}

PERSONA 2: ${partnerData.name}
Fecha: ${partnerData.birth_date}
Hora: ${partnerData.birth_time}
Ciudad: ${partnerData.birth_city}, ${partnerData.birth_country}

IMPORTANTE: Responde ÚNICAMENTE con HTML válido. Usa estas etiquetas: <h2> para títulos, <p> para párrafos, <strong> para conceptos clave, <ul><li> para listas. Sin markdown, sin asteriscos.

Estructura obligatoria (cada sección mínimo 3 párrafos extensos):

<h2>✦ La Dinámica Central: Sol, Luna y Ascendente de Ambos</h2>
Analiza cómo interactúan los soles, lunas y ascendentes de ${birthData.name} y ${partnerData.name}. Qué se activa entre ellos, qué se complementa y qué genera tensión creativa.

<h2>✦ Sinastría: Los Aspectos que los Unen</h2>
Los 6-8 aspectos interplanetarios más significativos entre ambas cartas. Para cada aspecto, explica qué área de la relación afecta y cómo se manifiesta en el día a día.

<h2>✦ Casas Activadas: Lo que Cada Uno Despierta en el Otro</h2>
Qué casas de ${birthData.name} activa ${partnerData.name} y viceversa. Qué áreas de vida se ven transformadas por este vínculo.

<h2>✦ Las Fortalezas de Esta Unión</h2>
Los 3-4 mayores dones y recursos compartidos. En qué se apoyan mutuamente, dónde fluyen con naturalidad y qué construyen juntos con facilidad.

<h2>✦ Los Desafíos y el Crecimiento</h2>
Las 3-4 áreas de fricción o tensión. Por qué aparecen, qué vienen a enseñar y cómo trabajarlas conscientemente para que sean motor de crecimiento en lugar de fuente de conflicto.

<h2>✦ El Propósito Conjunto de Esta Relación</h2>
La misión evolutiva de este vínculo. Por qué se encontraron estas dos almas, qué vienen a sanar, aprender o crear juntos. El tema kármico central de la relación.

<h2>✦ 5 Prácticas para Fortalecer el Vínculo</h2>
Cinco recomendaciones concretas, específicas y aplicables para nutrir esta relación y honrar su propósito evolutivo.

Tono: revelador, compasivo, profundo y orientado al crecimiento. Habla a ambos directamente.`;
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
