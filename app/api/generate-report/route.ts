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

  const reglasComunes = `
REGLAS OBLIGATORIAS:
1. TONO HONESTO Y REALISTA: No seas excesivamente optimista. Nombra claramente los desafíos reales que muestra la carta. Si algo es difícil, dilo. Si hay posibilidades de cambio o mejora, condiciónalas a acciones concretas — nunca prometas resultados sin esfuerzo. Deja puertas entreabiertas, no certezas vacías.
2. CONTEXTO PRIMERO: Si hay contexto personal, es el eje de todo. Cada sección debe responder a esa situación real, no hacer un análisis genérico del signo.
3. HTML ÚNICAMENTE: Usa <h2> para títulos, <p> para párrafos, <strong> para conceptos clave, <ul><li> para listas. Sin markdown, sin asteriscos, sin texto fuera de etiquetas HTML.
4. SIN REPETICIÓN: Cada sección aporta información nueva. No repitas conceptos ya mencionados.`;

  if (productSlug === 'lectura-esencial') {
    return `Eres un astrólogo profesional experto en astrología evolutiva. Genera una Lectura Esencial extensa, profunda y completamente personalizada para:

${base}
${reglasComunes}
5. Mínimo 3 párrafos extensos por sección.

<h2>✦ Introducción: Tu Momento Astrológico</h2>
Una síntesis inicial que contextualice a ${birthData.name} en su momento actual. Qué etapa de vida está atravesando según su carta y cómo se relaciona con lo que está viviendo. Sé directo/a — si es un momento difícil, nómbralo como tal.

<h2>✦ Tu Sol, Luna y Ascendente en Esta Situación</h2>
Interpreta las tres luminarias de ${birthData.name} en relación directa con su contexto real. Qué fortalezas genuinas tienen y también qué patrones o sombras estas energías pueden estar generando en su situación actual.

<h2>✦ Los Planetas que Marcan Este Ciclo</h2>
Mercurio, Venus, Marte, Júpiter y Saturno en su carta: cómo cada uno influye en lo que está viviendo. Incluye tanto los dones como las tensiones que cada planeta genera.

<h2>✦ Nodos Lunares y Quirón: La Raíz Más Profunda</h2>
Qué viene a aprender ${birthData.name} en esta vida (Nodo Norte) y qué patrones del pasado lo/la frenan (Nodo Sur). Cómo la herida de Quirón aparece en su situación actual y qué camino de integración ofrece.

<h2>✦ Los Tránsitos de ${mes}: Las Energías Activas Ahora</h2>
Qué planetas están en movimiento significativo este mes para su carta natal. Períodos de tensión, períodos de apertura. Sé específico/a sobre qué áreas de vida están siendo activadas.

<h2>✦ Lo Que Tu Alma Viene a Aprender Aquí</h2>
Desde la astrología evolutiva, qué viene a enseñarle esta situación. Qué parte de sí mismo/a está siendo invitado/a a transformar. No endulces la respuesta — si hay algo que soltar o enfrentar, dilo con claridad y compasión.

<h2>✦ 4 Pasos Concretos Para Este Momento</h2>
Cuatro acciones específicas, reales y aplicables que ${birthData.name} puede tomar ahora. No consejos genéricos — pasos que respondan directamente a su situación y a lo que muestra su carta.

Tono: honesto, profundo y compasivo. Habla a ${birthData.name} en segunda persona como un astrólogo que le dice la verdad con cariño.`;
  }

  if (productSlug === 'consulta-evolutiva') {
    return `Eres un astrólogo profesional experto en astrología evolutiva y kármica. Genera una Consulta Evolutiva completa, extensa y profundamente personalizada para:

${base}
${reglasComunes}
5. Mínimo 3 párrafos extensos por sección. No idealices — nombra tanto luces como sombras.

<h2>✦ Introducción: Quién Eres y Dónde Estás</h2>
Una síntesis inicial que sitúe a ${birthData.name} en su momento evolutivo actual. Qué etapa de vida atraviesa según su carta, qué temas centrales están en juego y cómo su situación actual encaja en un arco mayor. Si el momento es complejo, nómbralo.

<h2>✦ Tu Carta Natal: El Mapa Completo del Alma</h2>
Sol, Luna y Ascendente interpretados en función de su vida real. Luego Mercurio, Venus, Marte, Júpiter y Saturno con sus signos y casas — tanto los dones genuinos como las tensiones y patrones que cada planeta genera.

<h2>✦ Las Casas Más Activadas: Las Áreas en Movimiento</h2>
Las 4 casas más cargadas de energía. Qué áreas de vida están siendo el escenario principal y cómo se relacionan con lo que ${birthData.name} está viviendo — incluyendo lo que puede estar siendo evitado o resistido.

<h2>✦ Los Aspectos que Te Forman: Tensiones y Dones</h2>
Los 5 aspectos más significativos. Para cada uno: qué tensión o don crea, cómo se manifiesta concretamente en su vida y qué tiene que aprender de esa energía. Sé honesto/a sobre los aspectos difíciles.

<h2>✦ Nodos Lunares: Tu Misión y Tu Karma</h2>
Nodo Norte (dirección de evolución) y Nodo Sur (patrones del pasado que frenan). Cómo esta dinámica explica patrones recurrentes en su vida y cómo aparece en su situación actual.

<h2>✦ Quirón: La Herida que Moldea Todo</h2>
La herida primordial de ${birthData.name}, cómo se formó, cómo se manifiesta en sus relaciones y decisiones, y de qué forma esta situación actual la está tocando. El camino real de integración — no solo esperanzador, sino honesto sobre lo que requiere.

<h2>✦ Los Tránsitos del Año: Lo que el Cielo Está Moviendo</h2>
Júpiter, Saturno, Urano, Neptuno y Plutón sobre su carta. Qué está siendo removido o consolidado, períodos de mayor tensión y períodos de apertura. Información concreta, no solo positiva.

<h2>✦ Tu Revolución Solar: El Tema de Este Año</h2>
El foco del año en curso. Qué está siendo llamado a vivir, qué está cerrando y qué está abriendo. Cómo su situación actual es parte de ese ciclo anual.

<h2>✦ Tu Plan de Crecimiento: 5 Pasos Reales</h2>
Cinco acciones concretas y específicas alineadas con su carta y momento actual. Que impliquen esfuerzo real — no promesas fáciles. Que respondan directamente a lo que está viviendo.

Tono: transformador, honesto y compasivo. Habla a ${birthData.name} en segunda persona como un guía que dice la verdad con profundidad y cariño.`;
  }

  if (productSlug === 'especial-parejas' && partnerData) {
    return `Eres un astrólogo especializado en sinastría y astrología relacional. Genera un Especial Parejas completo, extenso y profundamente honesto para:

PERSONA 1: ${birthData.name}
${base}

PERSONA 2: ${partnerData.name}
Fecha: ${partnerData.birth_date}
Hora: ${partnerData.birth_time}
Ciudad: ${partnerData.birth_city}, ${partnerData.birth_country}
${reglasComunes}
5. Mínimo 3 párrafos extensos por sección. Menciona a ambos por nombre constantemente.
6. HONESTIDAD RELACIONAL: Si la sinastría muestra incompatibilidades serias, nómbralas claramente. Si hay posibilidad de que la relación funcione, condiciona esa posibilidad a cambios concretos — no des garantías vacías. Deja puertas entreabiertas, no certezas.

<h2>✦ Introducción: El Encuentro de Estas Dos Almas</h2>
Una síntesis inicial del vínculo entre ${birthData.name} y ${partnerData.name}. Qué tipo de conexión muestra la sinastría en términos generales, qué temas centrales están en juego y cómo su situación actual se enmarca en ese patrón mayor. Si hay tensiones importantes, nómbralas desde el principio.

<h2>✦ Quiénes Son: Sus Cartas Individuales</h2>
Sol, Luna y Ascendente de cada uno por separado. Qué necesita cada persona en el amor, cómo se relaciona emocionalmente, qué busca en una pareja — y dónde esas necesidades pueden chocar o complementarse.

<h2>✦ La Dinámica Central: Lo que Se Enciende Entre Ellos</h2>
Cómo interactúan sus soles, lunas y ascendentes. Qué se activa, qué se complementa y qué genera fricción real. Conecta esta dinámica directamente con lo que están viviendo en su relación.

<h2>✦ Los Aspectos que Definen Este Vínculo</h2>
Los 6-7 aspectos interplanetarios más significativos. Para cada uno: qué área de la relación impacta, cómo se vive concretamente y si es una energía que une o que tensiona. Sé honesto/a sobre los aspectos difíciles.

<h2>✦ Las Fortalezas Reales de Esta Unión</h2>
Los dones genuinos de esta pareja — no los que podrían tener, sino los que realmente muestran sus cartas. Dónde fluyen con autenticidad y qué pueden construir juntos.

<h2>✦ Los Desafíos que Esta Relación Enfrenta</h2>
Las tensiones más importantes según la sinastría. Por qué aparecen, qué patrón revelan en cada uno, y qué implicaría realmente trabajarlas. Si alguna tensión es estructural y difícil de resolver, dilo con claridad y compasión.

<h2>✦ El Propósito Kármico: Por Qué Se Encontraron</h2>
La misión evolutiva de este vínculo. Qué vienen a sanar o aprender juntos. Cómo su situación actual forma parte de ese arco mayor — incluyendo la posibilidad de que parte del aprendizaje sea separarse o transformar radicalmente la relación.

<h2>✦ El Camino Posible: Qué Necesitaría Cambiar</h2>
Si la relación tiene posibilidades de funcionar o mejorar, describe concretamente qué tendría que cambiar en cada uno y en la dinámica. Sé específico/a — no basta con "comunicarse mejor". Si los cambios requeridos son muy profundos, nómbralo honestamente.

<h2>✦ 5 Pasos Concretos Para Este Momento</h2>
Cinco acciones específicas para ${birthData.name} y ${partnerData.name} que respondan directamente a su situación real y a los patrones identificados. Que impliquen trabajo real, no solo buenas intenciones.

Tono: honesto, compasivo y directo. Habla a ambos en segunda persona. Deja puertas entreabiertas pero sin falsas promesas.`;
  }

  return `Genera un análisis astrológico personalizado en HTML para ${birthData.name}, nacido/a el ${birthData.birth_date} a las ${birthData.birth_time} en ${birthData.birth_city}, ${birthData.birth_country}. Sé profundo, honesto y evolutivo. Usa etiquetas <h2> y <p>.`;
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
