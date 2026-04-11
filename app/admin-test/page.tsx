'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, RefreshCw, CircleCheck as CheckCircle2, Clock, Circle as XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Report {
  id: string;
  status: string;
  created_at: string;
  generated_at: string | null;
  ai_response: string | null;
  error_message: string | null;
  transaction: {
    id: string;
    paddle_transaction_id: string;
    product: {
      name_es: string;
      slug: string;
    };
    birth_data: {
      name: string;
      birth_date: string;
      birth_time: string;
    };
  };
}

export default function AdminTestPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          status,
          created_at,
          generated_at,
          ai_response,
          error_message,
          transaction:transactions(
            id,
            paddle_transaction_id,
            product:products(name_es, slug),
            birth_data:birth_data(name, birth_date, birth_time)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching reports:', error);
      } else {
        setReports(data as any);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completado</Badge>;
      case 'generating':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Generando</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Fallido</Badge>;
      default:
        return <Badge className="bg-gray-500"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Panel de Pruebas - Reportes</h1>
            <p className="text-gray-300">
              Monitorea los reportes generados y verifica la integración con Gemini
            </p>
          </div>
          <Button
            onClick={fetchReports}
            disabled={loading}
            className="bg-white/10 hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports List */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Reportes Recientes</CardTitle>
              <CardDescription className="text-gray-300">
                Últimos 20 reportes generados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No hay reportes aún. Usa la página de prueba para generar uno.
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedReport?.id === report.id
                          ? 'bg-white/20 border-white/40'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">
                            {report.transaction?.product?.name_es || 'Producto desconocido'}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {report.transaction?.birth_data?.name || 'Sin nombre'}
                          </p>
                        </div>
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="text-xs text-gray-500">
                        ID: {report.id.slice(0, 8)}... • {new Date(report.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Details */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Detalles del Reporte</CardTitle>
              <CardDescription className="text-gray-300">
                {selectedReport ? 'Contenido completo del reporte' : 'Selecciona un reporte para ver detalles'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedReport ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Información</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Estado:</span>
                        {getStatusBadge(selectedReport.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Creado:</span>
                        <span className="text-white">
                          {new Date(selectedReport.created_at).toLocaleString('es-ES')}
                        </span>
                      </div>
                      {selectedReport.generated_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Generado:</span>
                          <span className="text-white">
                            {new Date(selectedReport.generated_at).toLocaleString('es-ES')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Producto:</span>
                        <span className="text-white">
                          {selectedReport.transaction?.product?.name_es || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cliente:</span>
                        <span className="text-white">
                          {selectedReport.transaction?.birth_data?.name || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedReport.error_message && (
                    <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <h4 className="text-red-300 font-semibold mb-2">Error</h4>
                      <p className="text-red-200 text-sm">{selectedReport.error_message}</p>
                    </div>
                  )}

                  {selectedReport.ai_response && (
                    <div>
                      <h4 className="text-white font-semibold mb-2">Respuesta de IA</h4>
                      <div className="max-h-96 overflow-y-auto p-4 bg-black/30 rounded-lg">
                        <pre className="text-gray-300 text-xs whitespace-pre-wrap break-words">
                          {selectedReport.ai_response}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedReport.status === 'generating' && (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-8 h-8 animate-spin text-white mr-3" />
                      <span className="text-white">Generando reporte...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  Selecciona un reporte de la lista para ver sus detalles
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="mt-6 bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Enlaces Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => window.location.href = '/test-report'}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Generar Reporte de Prueba
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Ir al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-6 p-6 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <h3 className="text-white font-semibold text-lg mb-3">Cómo usar el sistema de pruebas</h3>
          <ol className="text-gray-300 space-y-2 list-decimal list-inside">
            <li>Ve a la página de <a href="/test-report" className="text-blue-400 hover:underline">Generar Reporte de Prueba</a></li>
            <li>Completa los datos de nacimiento y selecciona un producto</li>
            <li>Haz clic en &quot;Generar Reporte de Prueba&quot;</li>
            <li>Vuelve aquí y actualiza para ver el progreso</li>
            <li>El reporte se generará con Gemini AI y se guardará en Supabase</li>
            <li>Código de descuento TEST100 (100% off) ya disponible en la base de datos</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
