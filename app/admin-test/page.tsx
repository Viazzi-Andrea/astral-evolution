'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, RefreshCw, CircleCheck as CheckCircle2, Clock, Circle as XCircle, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Report {
  id: string;
  transaction_id: string;
  status: string;
  created_at: string;
  generated_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  transaction: {
    id: string;
    product: { name_es: string; slug: string } | null;
    birth_data: { name: string; birth_date: string; birth_time: string } | null;
  } | null;
}

type StatusFilter = 'all' | 'failed' | 'completed' | 'pending' | 'generating';

export default function AdminTestPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [retrying, setRetrying] = useState<string | null>(null);
  const [adminSecret, setAdminSecret] = useState('');
  const [retryResult, setRetryResult] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
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
          transaction:transactions(
            id,
            product:products(name_es, slug),
            birth_data:birth_data(name, birth_date, birth_time)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching reports:', error);
      } else {
        setReports(data as unknown as Report[]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 30000); // Auto-refresh cada 30s
    return () => clearInterval(interval);
  }, [fetchReports]);

  const handleRetry = async (report: Report) => {
    const txId = report.transaction_id || report.transaction?.id;
    if (!txId) return;
    if (!adminSecret) {
      setRetryResult('⚠️ Ingresá el ADMIN_SECRET primero');
      return;
    }
    setRetrying(report.id);
    setRetryResult(null);
    try {
      const res = await fetch('/api/admin/retry-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({ transactionId: txId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRetryResult('✅ Reporte regenerado correctamente');
      } else {
        setRetryResult(`❌ Error: ${data.error || JSON.stringify(data)}`);
      }
      await fetchReports();
    } catch (err) {
      setRetryResult(`❌ Error de red: ${err}`);
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" />Completado</Badge>;
      case 'generating':
        return <Badge className="bg-blue-500 shrink-0"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generando</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 shrink-0"><XCircle className="w-3 h-3 mr-1" />Fallido</Badge>;
      default:
        return <Badge className="bg-gray-500 shrink-0"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  const failedCount = reports.filter(r => r.status === 'failed').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Panel de Admin — Reportes</h1>
            <p className="text-gray-400 text-sm">Auto-refresh cada 30s · Mostrando últimos 50</p>
          </div>
          <Button onClick={fetchReports} disabled={loading} className="bg-white/10 hover:bg-white/20">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Filtros de estado */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'failed', 'completed', 'pending', 'generating'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                filter === s
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {s === 'all' ? `Todos (${reports.length})` : s}
              {s === 'failed' && failedCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">{failedCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Admin secret para retry */}
        <div className="mb-4 flex gap-2 items-center">
          <input
            type="password"
            placeholder="ADMIN_SECRET (para reintentar reportes)"
            value={adminSecret}
            onChange={e => setAdminSecret(e.target.value)}
            className="bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 w-72 focus:outline-none focus:border-purple-400"
          />
          {retryResult && (
            <span className={`text-sm ${retryResult.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {retryResult}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de reportes */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Reportes</CardTitle>
              <CardDescription className="text-gray-300">
                {reports.length} resultados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No hay reportes con este filtro.</div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedReport?.id === report.id
                          ? 'bg-white/20 border-white/40'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {report.transaction?.birth_data?.name ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {report.transaction?.birth_data?.birth_date ?? ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.transaction?.product?.name_es ?? '—'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(report.status)}
                          <span className="text-xs text-gray-500">
                            {new Date(report.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalle del reporte */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Detalle</CardTitle>
              <CardDescription className="text-gray-300">
                {selectedReport ? 'Reporte seleccionado' : 'Seleccioná un reporte'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedReport ? (
                <div className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estado:</span>
                      {getStatusBadge(selectedReport.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cliente:</span>
                      <span className="text-white">{selectedReport.transaction?.birth_data?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Producto:</span>
                      <span className="text-white">{selectedReport.transaction?.product?.name_es ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Creado:</span>
                      <span className="text-white text-xs">{new Date(selectedReport.created_at).toLocaleString('es-ES')}</span>
                    </div>
                    {selectedReport.generated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Generado:</span>
                        <span className="text-white text-xs">{new Date(selectedReport.generated_at).toLocaleString('es-ES')}</span>
                      </div>
                    )}
                    {selectedReport.sent_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email enviado:</span>
                        <span className="text-green-400 text-xs">{new Date(selectedReport.sent_at).toLocaleString('es-ES')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transaction ID:</span>
                      <span className="text-gray-300 text-xs font-mono">
                        {(selectedReport.transaction_id || selectedReport.transaction?.id || '—').slice(0, 16)}...
                      </span>
                    </div>
                  </div>

                  {selectedReport.error_message && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <h4 className="text-red-300 font-semibold mb-1 text-sm">Error</h4>
                      <p className="text-red-200 text-xs font-mono whitespace-pre-wrap break-all">
                        {selectedReport.error_message}
                      </p>
                    </div>
                  )}

                  {/* Botón de retry para failed/generating */}
                  {(selectedReport.status === 'failed' || selectedReport.status === 'generating') && (
                    <Button
                      onClick={() => handleRetry(selectedReport)}
                      disabled={retrying === selectedReport.id}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {retrying === selectedReport.id ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando... (puede tomar 1-3 min)</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" />Reintentar y reenviar email</>
                      )}
                    </Button>
                  )}

                  {selectedReport.status === 'completed' && !selectedReport.sent_at && (
                    <Button
                      onClick={() => handleRetry(selectedReport)}
                      disabled={retrying === selectedReport.id}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {retrying === selectedReport.id ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reenviando...</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" />Reenviar email (no enviado)</>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  Seleccioná un reporte de la lista
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-gray-300">
          <strong className="text-white">Cómo usar el retry:</strong> Ingresá el valor de <code className="bg-white/10 px-1 rounded">ADMIN_SECRET</code> de Vercel en el campo de arriba → seleccioná un reporte fallido → clic en "Reintentar". El reporte se regenera y el email se reenvía automáticamente.
        </div>
      </div>
    </div>
  );
}
