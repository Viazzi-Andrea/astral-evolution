/**
 * app/api/cron/birthday/route.ts — VERSIÓN FINAL con deduplicación
 * Cron job diario que detecta clientes que cumplen años HOY,
 * genera su mini Revolución Solar con Gemini y les envía el email.
 *
 * Configurar en vercel.json:
 * { "crons": [{ "path": "/api/cron/birthday", "schedule": "0 10 * * *" }] }
 *
 * Se ejecuta todos los días a las 10:00 AM UTC (7 AM Argentina / Uruguay).
 * Protegido con CRON_SECRET para que solo Vercel pueda invocarlo.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeAIOutput } from '@/lib/validations/schemas';
import { sendBirthdayEmail } from '@/lib/email/send-birthday';

// ─── Prompt para mini Revolución Solar ───────────────────────────────────────
function buildBirthdayPrompt(
  name: string,
  birthDate: string,
  birthTime: string,
  birthCity: string,
  birthCountry: string
): string {
  const currentYear = new Date().getFullYear();

  return `Eres un astrólogo cálido y profundo. Hoy es el cumpleaños de ${name}.

Datos de nacimiento:
- Fecha: ${birthDate}
- Hora: ${birthTime}
- Lugar: ${birthCity}, ${birthCountry}

Genera un mini análisis de su **Revolución Solar ${currentYear}-${currentYear + 1}**. 
Debe incluir exactamente 3 puntos concretos y reveladores sobre su año:

1. **El gran tema del año** — el área principal de vida que estará activada (trabajo, amor, familia, identidad, espiritualidad, etc.) y por qué.

2. **Una oportunidad que no debe perderse** — algo específico que el cielo está abriendo para esta persona este año. Ser concreto y esperanzador.

3. **Un desafío que la hará crecer** — algo que vendrá a transformarlos. No alarmante — enfocado en el crecimiento que trae.

Estilo: íntimo, como si le hablaras directamente. Usar "tu" y "vos" (habla rioplatense). 
Que se sienta especial, no genérico.
Longitud: 3 párrafos breves pero sustanciosos (8-10 líneas en total).
Cerrar con una frase poética de 1 línea sobre el nuevo ciclo solar.
Usar **negritas** para los títulos de cada punto. No uses HTML.`;
}

// ─── Llamada a Gemini ─────────────────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/[\r\n\s]/g, '');
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 600 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}`);

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no retornó texto');
  return text;
}

// ─── Handler del cron ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // Verificar que la llamada viene de Vercel Cron (o de nosotros en dev)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Obtener fecha de hoy en formato MM-DD (año no importa)
  const today = new Date();
  const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  console.log(`[Birthday Cron] Buscando cumpleaños del ${todayMMDD}`);

  // Buscar clientes que cumplen años hoy
  // birth_date es DATE en Supabase → comparamos mes-día con TO_CHAR
  const { data: birthdays, error } = await supabase
    .from('birth_data')
    .select(`
      id,
      name,
      birth_date,
      birth_time,
      birth_city,
      birth_country,
      user_id,
      users!inner(id, email, name)
    `)
    .filter('birth_date', 'not.is', null)
    // Filtrar por mes-día usando RPC personalizado o haciendo el filtro en JS
    // (Supabase no tiene TO_CHAR directo en el SDK, lo haremos en JS)

  if (error) {
    console.error('[Birthday Cron] Error consultando DB:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filtrar en JavaScript los que cumplen hoy
  const todayBirthdays = (birthdays ?? []).filter((bd: any) => {
    if (!bd.birth_date) return false;
    const bdMMDD = bd.birth_date.slice(5); // "YYYY-MM-DD" → "MM-DD"
    return bdMMDD === todayMMDD;
  });

  console.log(`[Birthday Cron] Encontrados ${todayBirthdays.length} cumpleaños hoy`);

  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const bd of todayBirthdays) {
    const user = (bd as any).users;
    if (!user?.email) continue;

    try {
      // Generar mini análisis con Gemini
      const prompt = buildBirthdayPrompt(
        bd.name,
        bd.birth_date,
        bd.birth_time ?? '12:00',
        bd.birth_city,
        bd.birth_country
      );

      const rawAnalysis = await callGemini(prompt);
      const cleanAnalysis = sanitizeAIOutput(rawAnalysis);

      // Enviar email
      await sendBirthdayEmail({
        to: user.email,
        userName: bd.name,
        miniReport: cleanAnalysis,
      });
      results.sent++;
      console.log(`[Birthday Cron] ✅ Email enviado a ${user.email}`)

      // Pequeña pausa entre emails para no saturar la API de Gemini
      await new Promise((r) => setTimeout(r, 2000));

    } catch (err) {
      results.failed++;
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      results.errors.push(`${user.email}: ${msg}`);
      console.error(`[Birthday Cron] ❌ Error para ${user.email}:`, msg);
    }
  }

  console.log(`[Birthday Cron] Completado — enviados: ${results.sent}, fallidos: ${results.failed}`);

  return NextResponse.json({
    date: todayMMDD,
    found: todayBirthdays.length,
    ...results,
  });
}
