/**
 * app/api/admin/api-health/route.ts
 * Verifica el estado de las claves API de los proveedores de AI.
 * Usa endpoints de modelos (sin costo de tokens) para validar credenciales.
 */

import { NextRequest, NextResponse } from 'next/server';

function verifyAdmin(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET?.trim() ?? 'astral2024admin';
  return (
    request.headers.get('x-admin-secret') === secret ||
    request.headers.get('authorization') === `Basic ${Buffer.from(`:${secret}`).toString('base64')}`
  );
}

async function checkGroq(): Promise<{ ok: boolean; latencyMs: number; detail: string }> {
  const apiKey = process.env.GROQ_API_KEY?.replace(/[\r\n\s]/g, '');
  if (!apiKey) return { ok: false, latencyMs: 0, detail: 'Clave no configurada' };

  const t0 = Date.now();
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - t0;
    if (res.ok) return { ok: true, latencyMs, detail: 'OK' };
    const body = await res.text().catch(() => '');
    return { ok: false, latencyMs, detail: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - t0, detail: err.message ?? 'Error de red' };
  }
}

async function checkGemini(): Promise<{ ok: boolean; latencyMs: number; detail: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/[\r\n\s]/g, '');
  if (!apiKey) return { ok: false, latencyMs: 0, detail: 'Clave no configurada' };

  const t0 = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const latencyMs = Date.now() - t0;
    if (res.ok) return { ok: true, latencyMs, detail: 'OK' };
    const body = await res.text().catch(() => '');
    return { ok: false, latencyMs, detail: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - t0, detail: err.message ?? 'Error de red' };
  }
}

async function checkMistral(): Promise<{ ok: boolean; latencyMs: number; detail: string }> {
  const apiKey = process.env.MISTRAL_API_KEY?.replace(/[\r\n\s]/g, '');
  if (!apiKey) return { ok: false, latencyMs: 0, detail: 'Clave no configurada' };

  const t0 = Date.now();
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - t0;
    if (res.ok) return { ok: true, latencyMs, detail: 'OK' };
    const body = await res.text().catch(() => '');
    return { ok: false, latencyMs, detail: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - t0, detail: err.message ?? 'Error de red' };
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const [groq, gemini, mistral] = await Promise.all([
    checkGroq(),
    checkGemini(),
    checkMistral(),
  ]);

  const allOk = groq.ok || gemini.ok; // Con al menos Groq o Gemini disponible, el sistema funciona

  return NextResponse.json({
    ok: allOk,
    checkedAt: new Date().toISOString(),
    providers: { groq, gemini, mistral },
  });
}
