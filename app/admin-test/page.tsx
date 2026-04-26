'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, RefreshCw, CircleCheck as CheckCircle2, Clock, Circle as XCircle, Send, LogIn, Wifi, WifiOff, Trash2 } from 'lucide-react';

interface Report {
  id:             string;
  transaction_id: string;
  status:         string;
  created_at:     string;
  generated_at:   string | null;
  sent_at:        string | null;
  error_message:  string | null;
  user_email:     string | null;
  user_name:      string | null;
  product_name:   string | null;
  product_slug:   string | null;
  birth_name:     string | null;
  birth_date:     string | null;
  birth_time:     string | null;
  amount:         number | null;
  currency:       string | null;
}

type StatusFilter = 'all' | 'failed' | 'completed' | 'pending' | 'generating';

export default function AdminTestPage() {
  const [reports, setReports]             = useState<Report[]>([]);
  const [loading, setLoading]             = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filter, setFilter]               = useState<StatusFilter>('all');
  const [actionId, setActionId]           = useState<string | null>(null);
  const [adminSecret, setAdminSecret]     = useState('');
  const [secretInput, setSecretInput]     = useState('');
  const [actionResult, setActionResult]   = useState<string | null>(null);
  const [health, setHealth]               = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [search, setSearch]               = useState('');

  const fetchHealth = useCallback(async (secret: string) => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/admin/api-health', {
        headers: { 'x-admin-secret': secret },
      });
      if (res.ok) setHealth(await res.json());
    } catch {}
    finally { setHealthLoading(false); }
  }, []);

  const fetchReports = useCallback(async (secret: string, statusFilter: StatusFilter) => {
    setLoading(true);
    setActionResult(null);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/admin/reports${params}`, {
        headers: { 'x-admin-secret': secret },
      });
      if (res.status === 401) {
        setAdminSecret('');
        setActionResult('❌ Clave incorrecta');
        setReports([]);
        return;
      }
      if (!res.ok) {
        setActionResult(`❌ Error del servidor: ${res.status}`);
        return;
      }
      const data: Report[] = await res.json();
      setReports(data);
    } catch (err) {
      setActionResult(`❌ Error de red: ${err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh cuando hay secret activo
  useEffect(() => {
    if (!adminSecret) return;
    fetchReports(adminSecret, filter);
    fetchHealth(adminSecret);
    const interval = setInterval(() => fetchReports(adminSecret, filter), 30000);
    const healthInterval = setInterval(() => fetchHealth(adminSecret), 120000);
    return () => { clearInterval(interval); clearInterval(healthInterval); };
  }, [adminSecret, filter, fetchReports, fetchHealth]);

  const handleLogin = () => {
    if (!secretInput.trim()) return;
    setAdminSecret(secretInput.trim());
  };

  const handleAction = async (report: Report) => {
    const txId = report.transaction_id;
    if (!txId || !adminSecret) return;

    setActionId(report.id);
    setActionResult(null);

    const isResend = report.status === 'completed';
    const endpoint = isResend ? '/api/admin/resend-email' : '/api/admin/retry-report';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
        body: JSON.stringify({ transactionId: txId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const msg = isResend
          ? `✅ Email reenviado a ${data.sentTo ?? report.user_email}`
          : '✅ Reporte regenerado y email enviado';
        setActionResult(msg);
      } else {
        setActionResult(`❌ Error: ${data.error ?? JSON.stringify(data)}`);
      }
      await fetchReports(adminSecret, filter);
    } catch (err) {
      setActionResult(`❌ Error de red: ${err}`);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (report: Report) => {
    if (!window.confirm(`¿Eliminar este reporte de prueba?\n\n${report.birth_name ?? report.user_name} — ${report.product_name}\n\nEsto borra el reporte y la transacción de la base de datos.`)) return;

    setDeletingId(report.id);
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/delete-report', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
        body: JSON.stringify({ reportId: report.id, transactionId: report.transaction_id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionResult('🗑️ Reporte eliminado');
        setSelectedReport(null);
        await fetchReports(adminSecret, filter);
      } else {
        setActionResult(`❌ Error eliminando: ${data.error}`);
      }
    } catch (err) {
      setActionResult(`❌ Error de red: ${err}`);
    } finally {
      setDeletingId(null);
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
  const unsentCount = reports.filter(r => r.status === 'completed' && !r.sent_at).length;

  const searchLower = search.toLowerCase();
  const visibleReports = searchLower
    ? reports.filter(r =>
        r.user_email?.toLowerCase().includes(searchLower) ||
        r.birth_name?.toLowerCase().includes(searchLower) ||
        r.user_name?.toLowerCase().includes(searchLower)
      )
    : reports;

  // ─── Pantalla de login si no hay secret ──────────────────────────────────────
  if (!adminSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-white text-center">Panel de Admin</CardTitle>
            <CardDescription className="text-gray-300 text-center">Astral Evolution · Reportes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="ADMIN_SECRET"
                value={secretInput}
                onChange={e => setSecretInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                autoFocus
              />
              <Button onClick={handleLogin} className="w-full bg-purple-600 hover:bg-purple-700">
                <LogIn className="w-4 h-4 mr-2" />Entrar
              </Button>
              {actionResult && (
                <p className="text-red-400 text-sm text-center">{actionResult}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Panel principal ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Panel de Admin — Reportes</h1>
            <p className="text-gray-400 text-sm">Auto-refresh 30s · Últimos 100 reportes</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fetchReports(adminSecret, filter)} disabled={loading} className="bg-white/10 hover:bg-white/20">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={() => { setAdminSecret(''); setSecretInput(''); }} className="bg-white/5 hover:bg-white/10 text-gray-400">
              Salir
            </Button>
          </div>
        </div>

        {/* Alertas */}
        {failedCount > 0 && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-sm text-red-300">
            ⚠️ {failedCount} reporte{failedCount > 1 ? 's' : ''} fallido{failedCount > 1 ? 's' : ''} — requiere{failedCount > 1 ? 'n' : ''} atención
          </div>
        )}
        {unsentCount > 0 && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-sm text-yellow-300">
            📧 {unsentCount} reporte{unsentCount > 1 ? 's' : ''} completado{unsentCount > 1 ? 's' : ''} sin email enviado
          </div>
        )}

        {/* Salud de APIs */}
        <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Estado de APIs</span>
            <button
              onClick={() => fetchHealth(adminSecret)}
              disabled={healthLoading}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              {healthLoading ? '...' : 'Actualizar'}
            </button>
          </div>
          {health ? (
            <div className="flex flex-wrap gap-3">
              {Object.entries(health.providers as Record<string, { ok: boolean; latencyMs: number; detail: string }>).map(([name, info]) => (
                <div key={name} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  info.ok
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  {info.ok
                    ? <Wifi className="w-3 h-3" />
                    : <WifiOff className="w-3 h-3" />
                  }
                  <span className="capitalize">{name}</span>
                  {info.ok && <span className="text-gray-500">{info.latencyMs}ms</span>}
                  {!info.ok && <span className="text-red-400 truncate max-w-[150px]" title={info.detail}>{info.detail.slice(0, 30)}</span>}
                </div>
              ))}
              <span className="text-xs text-gray-600 self-center">
                {new Date(health.checkedAt).toLocaleTimeString('es-ES')}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">{healthLoading ? 'Verificando...' : 'Sin datos — hacé clic en Actualizar'}</span>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'failed', 'completed', 'pending', 'generating'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                filter === s ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {s === 'all' ? `Todos (${reports.length})` : s}
              {s === 'failed' && failedCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">{failedCount}</span>
              )}
            </button>
          ))}
        </div>

        {actionResult && (
          <div className={`mb-4 p-3 rounded-lg text-sm border ${
            actionResult.startsWith('✅') || actionResult.startsWith('🗑️') ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}>
            {actionResult}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Reportes</CardTitle>
                  <CardDescription className="text-gray-300">
                    {visibleReports.length}{search ? ` de ${reports.length}` : ''} resultado{visibleReports.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
              <input
                type="text"
                placeholder="Buscar por email o nombre..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="mt-2 w-full bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
              />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              ) : visibleReports.length === 0 ? (
                <div className="text-center py-12 text-gray-400">{search ? 'Sin resultados para esa búsqueda.' : 'No hay reportes con este filtro.'}</div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {visibleReports.map(report => (
                    <div
                      key={report.id}
                      onClick={() => { setSelectedReport(report); setActionResult(null); }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedReport?.id === report.id
                          ? 'bg-white/20 border-white/40'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {report.birth_name ?? report.user_name ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{report.user_email ?? '—'}</p>
                          <p className="text-xs text-gray-500">{report.product_name ?? '—'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(report.status)}
                          {report.status === 'completed' && !report.sent_at && (
                            <span className="text-xs text-yellow-400">sin enviar</span>
                          )}
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

          {/* Detalle */}
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
                    <Row label="Estado">{getStatusBadge(selectedReport.status)}</Row>
                    <Row label="Cliente"><span className="text-white">{selectedReport.birth_name ?? selectedReport.user_name ?? '—'}</span></Row>
                    <Row label="Email">
                      <span className="text-blue-300 break-all">{selectedReport.user_email ?? '—'}</span>
                    </Row>
                    <Row label="Producto"><span className="text-white">{selectedReport.product_name ?? '—'}</span></Row>
                    {selectedReport.amount != null && (
                      <Row label="Monto"><span className="text-green-300">{selectedReport.currency} {selectedReport.amount}</span></Row>
                    )}
                    <Row label="Creado"><span className="text-white text-xs">{new Date(selectedReport.created_at).toLocaleString('es-ES')}</span></Row>
                    {selectedReport.generated_at && (
                      <Row label="Generado"><span className="text-white text-xs">{new Date(selectedReport.generated_at).toLocaleString('es-ES')}</span></Row>
                    )}
                    <Row label="Email enviado">
                      {selectedReport.sent_at
                        ? <span className="text-green-400 text-xs">{new Date(selectedReport.sent_at).toLocaleString('es-ES')}</span>
                        : <span className="text-yellow-400 text-xs">No enviado</span>
                      }
                    </Row>
                    <Row label="Transaction ID">
                      <span className="text-gray-300 text-xs font-mono break-all">
                        {selectedReport.transaction_id ?? '—'}
                      </span>
                    </Row>
                  </div>

                  {selectedReport.error_message && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <h4 className="text-red-300 font-semibold mb-1 text-sm">Error</h4>
                      <p className="text-red-200 text-xs font-mono whitespace-pre-wrap break-all">
                        {selectedReport.error_message}
                      </p>
                    </div>
                  )}

                  {/* Acciones según estado */}
                  {(selectedReport.status === 'pending' || selectedReport.status === 'failed' || selectedReport.status === 'generating') && (
                    <Button
                      onClick={() => handleAction(selectedReport)}
                      disabled={actionId === selectedReport.id}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {actionId === selectedReport.id
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando... (1-3 min)</>
                        : <><RefreshCw className="w-4 h-4 mr-2" />Generar y enviar email</>
                      }
                    </Button>
                  )}

                  {selectedReport.status === 'completed' && (
                    <Button
                      onClick={() => handleAction(selectedReport)}
                      disabled={actionId === selectedReport.id}
                      className={`w-full ${selectedReport.sent_at ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {actionId === selectedReport.id
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                        : <><Send className="w-4 h-4 mr-2" />{selectedReport.sent_at ? 'Reenviar email' : 'Enviar email (pendiente)'}</>
                      }
                    </Button>
                  )}

                  <Button
                    onClick={() => handleDelete(selectedReport)}
                    disabled={deletingId === selectedReport.id}
                    variant="outline"
                    className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    {deletingId === selectedReport.id
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Eliminando...</>
                      : <><Trash2 className="w-4 h-4 mr-2" />Eliminar reporte de prueba</>
                    }
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  Seleccioná un reporte de la lista
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-gray-400 shrink-0">{label}:</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
