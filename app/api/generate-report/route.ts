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
    return `Eres un astrÃ³logo profesional experto en astrologÃ­a evolutiva. Genera una Lectura Esencial personalizada para:

${base}

Incluye:
**Sol, Luna y Ascendente** â€” Las tres luminarias principales y su expresiÃ³n en la personalidad.
**TrÃ¡nsitos de ${mes}** â€” QuÃ© energÃ­as estÃ¡n activas y cÃ³mo aprovecharlas.
**3 Recomendaciones concretas** â€” Acciones especÃ­ficas alineadas con la energÃ­a actual.

ExtensiÃ³n: 4-6 pÃ¡rrafos bien desarrollados. Usa **negritas** para los tÃ­tulos de secciÃ³n. No uses HTML ni markdown complejo. Tono: profundo, inspirador y accesible.`;
  }

  if (productSlug === 'consulta-evolutiva') {
    return `Eres un astrÃ³logo profesional experto en astrologÃ­a evolutiva y karmica. Genera una Consulta Evolutiva completa para:

${base}

Incluye:
**Carta Natal** â€” Sol, Luna, Ascendente y planetas personales (Mercurio, Venus, Marte, JÃºpiter, Saturno).
**Las Casas Clave** â€” Las 3-4 casas mÃ¡s activadas y su mensaje evolutivo.
**Aspectos Planetarios Principales** â€” Las configuraciones mÃ¡s significativas.
**Nodos Lunares** â€” Nodo Norte (misiÃ³n del alma) y Nodo Sur (karma a soltar).
**QuirÃ³n** â€” La herida primordial y el camino de sanaciÃ³n.
**TrÃ¡nsitos Importantes del AÃ±o** â€” Saturno, JÃºpiter y planetas lentos.
**RevoluciÃ³n Solar** â€” El foco del aÃ±o en curso.
**Plan de Crecimiento** â€” 5 Ã¡reas de trabajo y recomendaciones especÃ­ficas.

ExtensiÃ³n: 12-15 pÃ¡rrafos profundos. Usa **negritas** para los tÃ­tulos. Tono: transformador y evolutivo.`;
  }

  if (productSlug === 'especial-parejas' && partnerData) {
    return `Eres un astrÃ³logo especializado en sinastrÃ­a y astrologÃ­a relacional. Genera un Especial Parejas para:

**PERSONA 1:**
${base}

**PERSONA 2:**
Nombre: ${partnerData.name}
Fecha: ${partnerData.birth_date}
Hora: ${partnerData.birth_time}
Ciudad: ${partnerData.birth_city}, ${partnerData.birth_country}

Incluye:
**Compatibilidad Esencial** â€” Sol, Luna y Ascendente de ambos y su dinÃ¡mica.
**SinastrÃ­a** â€” Los 5-7 aspectos interplanetarios mÃ¡s significativos.
**Casas Activadas** â€” QuÃ© activa cada uno en la carta del otro.
**Fortalezas de la Pareja** â€” Los 3 mayores dones compartidos.
**DesafÃ­os y Crecimiento** â€” 3 Ã¡reas de fricciÃ³n y cÃ³mo trabajarlas conscientemente.
**PropÃ³sito Conjunto** â€” La misiÃ³n evolutiva de esta relaciÃ³n.
**5 PrÃ¡cticas Recomendadas** â€” Acciones concretas para fortalecer el vÃ­nculo.

ExtensiÃ³n: 14-18 pÃ¡rrafos. Usa **negritas** para tÃ­tulos. Tono: revelador, compasivo y orientado al crecimiento.`;
  }

  return `Genera un anÃ¡lisis astrolÃ³gico personalizado para ${birthData.name}, nacido/a el ${birthData.birth_date} a las ${birthData.birth_time} en ${birthData.birth_city}, ${birthData.birth_country}. SÃ© profundo y evolutivo.`;
}

// â”€â”€â”€ Llamada a Gemini con limpieza de key â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function callGemini(prompt: string): Promise<string> {
  // Limpia saltos de lÃ­nea invisibles â€” bug conocido con echo en Vercel CLI
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
  if (!text) throw new Error('Gemini no retornÃ³ texto');
  return text;
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
      const emailResult = await sendReportEmail({
        toEmail: userEmail,`n        productSlug: productSlug,
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
        console.log(`[GenerateReport] âœ… Email enviado a ${userEmail}`);
      } else {
        console.error(`[GenerateReport] âš ï¸ Email fallÃ³:`, emailResult.error);
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
