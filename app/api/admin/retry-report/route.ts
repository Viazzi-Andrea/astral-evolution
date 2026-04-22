/**
 * app/api/admin/retry-report/route.ts
 * Reinicia un reporte fallido o atascado. Requiere ADMIN_SECRET en headers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: { transactionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { transactionId } = body;
  if (!transactionId) {
    return NextResponse.json({ error: 'Falta transactionId' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Resetear a 'pending' para que la idempotencia permita re-procesar
  const { error: resetError } = await supabase
    .from('reports')
    .update({ status: 'pending', error_message: null })
    .eq('transaction_id', transactionId)
    .in('status', ['failed', 'generating']);

  if (resetError) {
    console.error('[AdminRetry] Error reseteando reporte:', resetError);
    return NextResponse.json({ error: 'Error reseteando reporte' }, { status: 500 });
  }

  // Llamar a generate-report y esperar resultado (admin puede esperar)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://astralevolution.com';
  try {
    const genRes = await fetch(`${appUrl}/api/generate-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId }),
    });
    const result = await genRes.json().catch(() => ({}));
    return NextResponse.json({ success: genRes.ok, status: genRes.status, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[AdminRetry] Error llamando generate-report:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
