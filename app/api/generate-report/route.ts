/**
 * app/api/generate-report/route.ts
 * Astral Evolution — Generación de reporte astrológico completo
 *
 * Pipeline:
 *   1. Recibe birthData + productSlug validados con Zod
 *   2. Calcula la carta natal exacta con ephemeris.ts (algoritmos Meeus/VSOP87)
 *   3. Construye el prompt maestro estilo Greene/Arroyo/Sasportas
 *   4. Envía a Gemini 1.5 Flash con instrucción de sistema dedicada
 *   5. Sanitiza y devuelve el reporte
 *
 * ─── SECURITY LOGGING BLOCK ───────────────────────────────────────────────────
 *  [RPT][INFO]  → flujo normal
 *  [RPT][WARN]  → situación recuperable
 *  [RPT][ERROR] → fallo que interrumpe la generación
 *  [RPT][FATAL] → config rota
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { calculateNatalChart, localToUTC } from '@/lib/astro/ephemeris';
import type { BirthInput } from '@/lib/astro/ephemeris';
import {
  buildEssentialReadingPrompt,
  buildEvolutionaryConsultationPrompt,
  buildSynastryPrompt,
} from '@/lib/astro/prompts';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

// ════════════════════════════════════════════════════════════════
//  SECURITY LOGGING BLOCK
// ════════════════════════════════════════════════════════════════

function rptLog(
  level:    LogLevel,
  reqId:    string,
  message:  string,
  context?: Record<string, unknown>
): void {
  const ts     = new Date().toISOString();
  const prefix = `[RPT][${level}][${reqId}]`;
  const ctx    = context ? ` | ${JSON.stringify(context)}` : '';
  const line   = `${ts} ${prefix} ${message}${ctx}`;

  if (level === 'INFO')                        console.info(line);
  if (level === 'WARN')                        console.warn(line);
  if (level === 'ERROR' || level === 'FATAL')  console.error(line);
}

function diagnoseGeminiError(
  httpStatus: number,
  errorBody:  { error?: { code?: number; message?: string; status?: string } },
  reqId:      string
): string {
  const gc  = errorBody?.error?.code;
  const gs  = errorBody?.error?.status ?? '';
  const gm  = errorBody?.error?.message ?? '(sin mensaje)';

  rptLog('ERROR', reqId, `Gemini HTTP ${httpStatus}`, {
    google_code: gc, google_status: gs, google_message: gm,
  });

  if (httpStatus === 400 && gs === 'FAILED_PRECONDITION')
    return 'Modelo no disponible: verifica billing en Google Cloud Console.';
  if (httpStatus === 400)
    return `Petición malformada a Gemini: ${gm}`;
  if (httpStatus === 403)
    return 'API Key sin permisos. Habilita "Generative Language API" en Google Cloud Console.';
  if (httpStatus === 429)
    return 'Quota de Gemini agotada. Revisa límites en Google Cloud Console.';
  if (httpStatus === 503)
    return 'Servicio Gemini no disponible. Reintenta en unos minutos.';
  return `Error de Gemini (HTTP ${httpStatus}): ${gm}`;
}

// ════════════════════════════════════════════════════════════════
//  FIN SECURITY LOGGING BLOCK
// ════════════════════════════════════════════════════════════════

// ─── Schemas de validación (Zod) ─────────────────────────────────────────────

const BirthDataSchema = z.object({
  name:            z.string().min(1).max(100),
  birthDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  birthTime:       z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
  birthCity:       z.string().min(1).max(100),
  birthCountry:    z.string().min(1).max(100),
  latitude:        z.number().min(-90).max(90),
  longitude:       z.number().min(-180).max(180),
  tzOffsetMinutes: z.number().int().min(-840).max(840).default(0),
  personalContext: z.string().max(500).optional(),
});

const RequestSchema = z.object({
  productSlug:     z.enum(['lectura-esencial', 'consulta-evolutiva', 'especial-parejas']),
  birthData:       BirthDataSchema,
  partnerBirthData: BirthDataSchema.optional(),
});

// ─── Sanitización de la salida de Gemini ─────────────────────────────────────
//
//  Gemini puede devolver markdown. Eliminamos cualquier secuencia
//  que pueda interpretarse como HTML/script en el cliente.
//  (La sanitización completa ocurre también en el frontend con DOMPurify.)

function sanitizeReportOutput(text: string): string {
  return text
    // Eliminar cualquier tag HTML
    .replace(/<[^>]*>/g, '')
    // Eliminar secuencias de script inline
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Normalizar saltos de línea
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Eliminar líneas vacías excesivas (más de 2 consecutivas)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Construcción de BirthInput para el motor de efemérides ──────────────────

function parseBirthData(data: z.infer<typeof BirthDataSchema>): BirthInput {
  const [year, month, day] = data.birthDate.split('-').map(Number);
  const [hour, minute]     = data.birthTime.split(':').map(Number);

  // Convertir hora local a UTC
  const utc = localToUTC(year, month, day, hour, minute, data.tzOffsetMinutes);

  return {
    year:      utc.year,
    month:     utc.month,
    day:       utc.day,
    hour:      utc.hour,
    minute:    utc.minute,
    latitude:  data.latitude,
    longitude: data.longitude,
  };
}

// ─── Llamada a Gemini ─────────────────────────────────────────────────────────

async function callGemini(
  systemInstruction: string,
  userPrompt:        string,
  reqId:             string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey.length < 20) {
    rptLog('FATAL', reqId, 'GEMINI_API_KEY ausente o inválida');
    throw new Error('Servicio de IA no disponible');
  }

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  rptLog('INFO', reqId, 'Enviando carta natal a Gemini 1.5 Flash', {
    system_chars: systemInstruction.length,
    prompt_chars: userPrompt.length,
    model:        'gemini-1.5-flash',
  });

  const startMs = Date.now();

  let res: Response;
  try {
    res = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // system_instruction es el parámetro correcto en v1beta para Gemini 1.5
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role:  'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature:     0.82,   // Creatividad alta pero controlada
          maxOutputTokens: 4096,   // Suficiente para reportes completos
          topP:            0.94,
          topK:            40,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });
  } catch (netErr) {
    rptLog('ERROR', reqId, 'Error de red hacia Gemini', {
      error: netErr instanceof Error ? netErr.message : String(netErr),
    });
    throw new Error('Error de conectividad con el servicio de IA');
  }

  const latency = Date.now() - startMs;

  if (!res.ok) {
    let errBody: { error?: { code?: number; message?: string; status?: string } } = {};
    try { errBody = await res.json(); } catch { /* ignorar */ }
    const msg = diagnoseGeminiError(res.status, errBody, reqId);
    throw new Error(msg);
  }

  let data: {
    candidates?: Array<{
      content?:     { parts?: Array<{ text?: string }> };
      finishReason?: string;
      safetyRatings?: Array<{ category: string; probability: string }>;
    }>;
    promptFeedback?: { blockReason?: string };
  };

  try {
    data = await res.json();
  } catch {
    rptLog('ERROR', reqId, 'Respuesta de Gemini no es JSON válido');
    throw new Error('Respuesta inesperada del servicio de IA');
  }

  if (data.promptFeedback?.blockReason) {
    rptLog('WARN', reqId, 'Prompt bloqueado por Gemini', {
      block_reason: data.promptFeedback.blockReason,
    });
    throw new Error(`Contenido bloqueado: ${data.promptFeedback.blockReason}`);
  }

  const candidate = data.candidates?.[0];

  if (!candidate?.content && candidate?.finishReason === 'SAFETY') {
    rptLog('WARN', reqId, 'Respuesta filtrada por safety mid-generation', {
      safety_ratings: candidate?.safetyRatings,
    });
    throw new Error('La respuesta fue filtrada por los sistemas de seguridad. Reintenta.');
  }

  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) {
    rptLog('ERROR', reqId, 'Respuesta sin texto — estructura inesperada', {
      finish_reason:    candidate?.finishReason,
      candidates_count: data.candidates?.length,
    });
    throw new Error('Respuesta vacía de Gemini');
  }

  rptLog('INFO', reqId, '✅ Reporte generado por Gemini', {
    finish_reason: candidate.finishReason,
    output_chars:  text.length,
    latency_ms:    latency,
  });

  return text;
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 9).toUpperCase();

  rptLog('INFO', reqId, 'Solicitud de generación de reporte recibida');

  // Parsear body
  let raw: unknown;
  try { raw = await request.json(); }
  catch {
    return NextResponse.json({ error: 'JSON inválido', reqId }, { status: 400 });
  }

  // Validar con Zod
  const parsed = RequestSchema.safeParse(raw);
  if (!parsed.success) {
    rptLog('WARN', reqId, 'Datos de entrada inválidos', {
      errors: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten(), reqId },
      { status: 422 }
    );
  }

  const { productSlug, birthData, partnerBirthData } = parsed.data;

  // ── PASO 1: Calcular carta natal con el motor de efemérides ────────────────
  let chart1;
  let chart2;

  try {
    rptLog('INFO', reqId, 'Calculando carta natal con algoritmos Meeus/VSOP87', {
      subject: birthData.name,
      date:    birthData.birthDate,
      coords:  `${birthData.latitude}, ${birthData.longitude}`,
    });

    const birthInput1 = parseBirthData(birthData);
    chart1 = calculateNatalChart(birthInput1);

    rptLog('INFO', reqId, 'Carta natal calculada ✓', {
      sun:  `${chart1.chartSummary.sunSign}`,
      moon: `${chart1.chartSummary.moonSign}`,
      asc:  `${chart1.chartSummary.ascendantSign}`,
      jd:   chart1.julianDay.toFixed(4),
      aspects_found: chart1.aspects.length,
    });

    if (productSlug === 'especial-parejas' && partnerBirthData) {
      const birthInput2 = parseBirthData(partnerBirthData);
      chart2 = calculateNatalChart(birthInput2);
      rptLog('INFO', reqId, 'Carta natal de pareja calculada ✓', {
        subject: partnerBirthData.name,
        sun:     `${chart2.chartSummary.sunSign}`,
      });
    }

  } catch (calcErr) {
    rptLog('ERROR', reqId, 'Error en cálculo de efemérides', {
      error: calcErr instanceof Error ? calcErr.message : String(calcErr),
    });
    return NextResponse.json(
      { error: 'Error calculando la carta natal', reqId },
      { status: 500 }
    );
  }

  // ── PASO 2: Construir el prompt maestro ────────────────────────────────────
  let systemInstruction: string;
  let userPrompt: string;

  try {
    if (productSlug === 'lectura-esencial') {
      ({ systemInstruction, userPrompt } = buildEssentialReadingPrompt(
        chart1, birthData.name, birthData.personalContext
      ));
    } else if (productSlug === 'consulta-evolutiva') {
      ({ systemInstruction, userPrompt } = buildEvolutionaryConsultationPrompt(
        chart1, birthData.name, birthData.personalContext
      ));
    } else if (productSlug === 'especial-parejas' && chart2 && partnerBirthData) {
      ({ systemInstruction, userPrompt } = buildSynastryPrompt(
        chart1, birthData.name,
        chart2, partnerBirthData.name
      ));
    } else {
      return NextResponse.json(
        { error: 'Producto requiere datos de pareja', reqId },
        { status: 400 }
      );
    }

    rptLog('INFO', reqId, 'Prompt construido ✓', {
      product:      productSlug,
      prompt_chars: userPrompt.length,
    });

  } catch (promptErr) {
    rptLog('ERROR', reqId, 'Error construyendo el prompt', {
      error: promptErr instanceof Error ? promptErr.message : String(promptErr),
    });
    return NextResponse.json(
      { error: 'Error construyendo el reporte', reqId },
      { status: 500 }
    );
  }

  // ── PASO 3: Llamar a Gemini y sanitizar salida ─────────────────────────────
  let rawReport: string;
  try {
    rawReport = await callGemini(systemInstruction, userPrompt, reqId);
  } catch (geminiErr) {
    return NextResponse.json(
      {
        error:  geminiErr instanceof Error ? geminiErr.message : 'Error del servicio de IA',
        reqId,
      },
      { status: 500 }
    );
  }

  const report = sanitizeReportOutput(rawReport);

  rptLog('INFO', reqId, '✅ Reporte final listo para entrega', {
    final_chars: report.length,
    product:     productSlug,
  });

  return NextResponse.json({
    success:  true,
    report,
    reqId,
    meta: {
      product:  productSlug,
      subject:  birthData.name,
      sunSign:  chart1.chartSummary.sunSign,
      moonSign: chart1.chartSummary.moonSign,
      ascSign:  chart1.chartSummary.ascendantSign,
    },
  });
}
