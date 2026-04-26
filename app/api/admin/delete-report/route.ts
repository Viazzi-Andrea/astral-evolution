/**
 * app/api/admin/delete-report/route.ts
 * Elimina un reporte (y su transacción) de la base de datos.
 * Solo para uso administrativo — borrar registros de prueba.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function verifyAdmin(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET?.trim() ?? 'astral2024admin';
  const xSecret = request.headers.get('x-admin-secret');
  if (xSecret === secret) return true;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Basic ')) {
    try {
      const decoded = atob(authHeader.slice(6));
      const password = decoded.split(':').slice(1).join(':');
      return password === secret;
    } catch {}
  }
  return false;
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { reportId, transactionId } = body;
  if (!reportId) {
    return NextResponse.json({ error: 'reportId requerido' }, { status: 422 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Eliminar reporte
  const { error: reportError } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (reportError) {
    console.error('[DeleteReport] Error eliminando reporte:', reportError);
    return NextResponse.json({ error: reportError.message }, { status: 500 });
  }

  // Eliminar transacción asociada si se provee el ID
  if (transactionId) {
    await supabase.from('birth_data')
      .delete()
      .eq('id', (await supabase.from('transactions').select('birth_data_id').eq('id', transactionId).single()).data?.birth_data_id ?? '');

    await supabase.from('transactions').delete().eq('id', transactionId);
  }

  console.log(`[DeleteReport] ✅ Eliminado — report: ${reportId}, tx: ${transactionId ?? 'n/a'}`);
  return NextResponse.json({ success: true });
}
