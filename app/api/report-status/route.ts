/**
 * app/api/report-status/route.ts
 * Consulta el estado del reporte para la página /gracias
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const QuerySchema = z.object({
  transactionId: z.string().uuid('ID inválido'),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({ transactionId: searchParams.get('transactionId') });

  if (!parsed.success) {
    return NextResponse.json({ error: 'ID de transacción inválido' }, { status: 400 });
  }

  const { transactionId } = parsed.data;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('reports')
    .select('status, generated_at')
    .eq('transaction_id', transactionId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Error consultando reporte' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ status: 'not_found' });
  }

  return NextResponse.json({ status: data.status, generatedAt: data.generated_at });
}
