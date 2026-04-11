import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateAstrologicalReport } from '@/lib/ai/generate-report';
import { generatePDF } from '@/lib/pdf/generator';
import crypto from 'crypto';

function verifyPaddleWebhook(body: string, signature: string): boolean {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('PADDLE_WEBHOOK_SECRET not configured');
    return false;
  }

  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('paddle-signature') || '';

    if (!verifyPaddleWebhook(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event_type === 'transaction.completed') {
      const transactionId = event.data.custom_data?.transaction_id;

      if (!transactionId) {
        console.error('No transaction_id in webhook data');
        return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
      }

      const { data: transaction, error: txError } = await supabaseAdmin
        .from('transactions')
        .select(`
          *,
          products (*),
          birth_data (*),
          users (*)
        `)
        .eq('id', transactionId)
        .maybeSingle();

      if (txError || !transaction) {
        console.error('Transaction not found:', txError);
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'completed',
          paddle_transaction_id: event.data.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      let partnerBirthData = null;
      if (transaction.partner_birth_data_id) {
        const { data } = await supabaseAdmin
          .from('birth_data')
          .select('*')
          .eq('id', transaction.partner_birth_data_id)
          .maybeSingle();
        partnerBirthData = data;
      }

      console.log('Generating astrological report with Gemini...');
      const reportContent = await generateAstrologicalReport(
        transaction.products,
        transaction.birth_data,
        partnerBirthData || undefined
      );

      console.log('Generating PDF...');
      const pdfBuffer = await generatePDF(
        reportContent,
        transaction.products.name_es,
        transaction.birth_data.name
      );

      const fileName = `reporte-${transaction.id}.pdf`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('reports')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading PDF:', uploadError);
        return NextResponse.json({ error: 'Error uploading report' }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin
        .storage
        .from('reports')
        .getPublicUrl(fileName);

      await supabaseAdmin
        .from('transactions')
        .update({
          report_url: urlData.publicUrl,
          report_generated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      console.log('Report generated and stored successfully');

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, ignored: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
