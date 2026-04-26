/**
 * app/api/admin/resend-email/route.ts
 * Reenvía el email de un reporte ya completado sin regenerarlo.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReportEmail } from '@/lib/email/send-report';

export const maxDuration = 60;

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

  const { data: report, error } = await supabase
    .from('reports')
    .select(`
      id,
      ai_response,
      status,
      transactions(
        products(name_es),
        birth_data:birth_data!transactions_birth_data_id_fkey(name),
        users(name, email)
      )
    `)
    .eq('transaction_id', transactionId)
    .eq('status', 'completed')
    .maybeSingle();

  if (error || !report) {
    return NextResponse.json({ error: 'Reporte no encontrado o no completado' }, { status: 404 });
  }

  const tx         = (report as any).transactions;
  const userEmail  = tx?.users?.email;
  const userName   = tx?.users?.name ?? tx?.birth_data?.name ?? 'Cliente';
  const productName = tx?.products?.name_es ?? 'Lectura Astrológica';
  const aiResponse  = report.ai_response;

  if (!userEmail) {
    return NextResponse.json({ error: 'No hay email de cliente para este reporte' }, { status: 400 });
  }
  if (!aiResponse) {
    return NextResponse.json({ error: 'El reporte no tiene contenido generado' }, { status: 400 });
  }

  // URL del SVG en Supabase Storage
  const { data: urlData } = supabase.storage
    .from('charts')
    .getPublicUrl(`charts/${transactionId}.svg`);
  const chartDataUrl = urlData?.publicUrl;

  const htmlForEmail = markdownToHTML(aiResponse);

  try {
    await sendReportEmail({ to: userEmail, userName, productName, reportHTML: htmlForEmail, chartDataUrl });

    await supabase
      .from('reports')
      .update({ sent_at: new Date().toISOString() })
      .eq('transaction_id', transactionId);

    console.log(`[ResendEmail] ✅ Email reenviado a ${userEmail}`);
    return NextResponse.json({ success: true, sentTo: userEmail });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[ResendEmail] ❌', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function markdownToHTML(text: string): string {
  let t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  t = t.replace(/^#{3} (.+)$/gm, '<h3>$1</h3>');
  t = t.replace(/^#{2} (.+)$/gm, '<h2>$1</h2>');
  t = t.replace(/^#{1} (.+)$/gm, '<h1>$1</h1>');
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  t = t.replace(/^[·•\-\*] (.+)$/gm, '<li>$1</li>');
  t = t.replace(/(<li>[^\n]+<\/li>\n?)+/g, match => `<ul>${match}</ul>`);
  t = t.replace(/^---+$/gm, '<hr>');
  t = t.replace(/^(?!<\/?(h[1-6]|ul|li|hr|p|strong|em)[ >])(.+)$/gm, '<p>$2</p>');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}
