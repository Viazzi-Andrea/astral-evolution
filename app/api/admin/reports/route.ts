import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const statusFilter = request.nextUrl.searchParams.get('status');

  let query = supabase
    .from('reports')
    .select(`
      id,
      transaction_id,
      status,
      created_at,
      generated_at,
      sent_at,
      error_message,
      transactions(
        id,
        amount,
        currency,
        products(name_es, slug),
        birth_data:birth_data!transactions_birth_data_id_fkey(name, birth_date, birth_time),
        users(name, email)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[AdminReports] Error Supabase:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalizar a estructura plana para el cliente
  const normalized = (data ?? []).map((r: any) => ({
    id:               r.id,
    transaction_id:   r.transaction_id,
    status:           r.status,
    created_at:       r.created_at,
    generated_at:     r.generated_at,
    sent_at:          r.sent_at,
    error_message:    r.error_message,
    user_email:       r.transactions?.users?.email ?? null,
    user_name:        r.transactions?.users?.name ?? null,
    product_name:     r.transactions?.products?.name_es ?? null,
    product_slug:     r.transactions?.products?.slug ?? null,
    birth_name:       r.transactions?.birth_data?.name ?? null,
    birth_date:       r.transactions?.birth_data?.birth_date ?? null,
    birth_time:       r.transactions?.birth_data?.birth_time ?? null,
    amount:           r.transactions?.amount ?? null,
    currency:         r.transactions?.currency ?? null,
  }));

  return NextResponse.json(normalized);
}
