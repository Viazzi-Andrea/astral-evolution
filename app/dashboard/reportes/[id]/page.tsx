'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Sparkles, Loader as Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ReportViewerPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/'); return; }

      const { data, error } = await supabase
        .from('reports')
        .select(`
          id, status, ai_response, generated_at,
          transaction:transactions!inner (
            user_id,
            product:products!inner (name_es),
            birth_data:birth_data!transactions_birth_data_id_fkey (name)
          )
        `)
        .eq('id', reportId)
        .single();

      if (error || !data) {
        setError('Reporte no encontrado.');
        setLoading(false);
        return;
      }

      const tx = (data as any).transaction;
      if (tx.user_id !== session.user.id) {
        setError('No tenés acceso a este reporte.');
        setLoading(false);
        return;
      }

      setReport(data);
      setLoading(false);
    }
    load();
  }, [reportId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/dashboard" className="text-blue-400 hover:underline">Volver al Dashboard</Link>
        </div>
      </div>
    );
  }

  const tx = report.transaction;
  const personName = tx?.birth_data?.name ?? 'Tu lectura';
  const productName = tx?.product?.name_es ?? 'Auditoría Astral';

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Mis Informes
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{productName}</h1>
              <p className="text-sm text-gray-400">
                {personName} · {new Date(report.generated_at).toLocaleDateString('es-ES', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10">
          {report.status !== 'completed' || !report.ai_response ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-gray-400">Tu auditoría astral está siendo canalizada...</p>
              <p className="text-sm text-gray-500 mt-2">Recibirás un email cuando esté lista.</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-blue max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-lg prose-h3:text-blue-300
              prose-p:text-gray-300 prose-p:leading-relaxed
              prose-strong:text-white prose-strong:font-semibold
              prose-li:text-gray-300
              prose-hr:border-white/10">
              <ReactMarkdown>{report.ai_response}</ReactMarkdown>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
