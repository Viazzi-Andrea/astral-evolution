'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Report, Transaction, Product } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, ExternalLink, Sparkles, User, Plus, Clock, CircleCheck as CheckCircle, Loader as Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ReportWithDetails extends Report {
  transaction: Transaction & {
    product: Product;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<ReportWithDetails[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log('No session found, redirecting to home');
        router.replace('/');
        return;
      }

      console.log('Session found:', session.user.id);
      setUser(session.user);
      await loadReports(session.user.id);
      setLoading(false);
    } catch (error) {
      console.error('Error checking auth:', error);
      setLoading(false);
      router.replace('/');
    }
  };

  const loadReports = async (userId: string) => {
    try {
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select(`
          *,
          transaction:transactions!inner (
            *,
            product:products!inner (*)
          )
        `)
        .eq('transaction.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(reportsData as any || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleViewReport = (report: ReportWithDetails) => {
    window.open(`/dashboard/reportes/${report.id}`, '_blank');
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'pending':
      case 'generating':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <Clock className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'generating':
        return 'Canalizando...';
      case 'completed':
        return 'Listo';
      case 'failed':
        return 'Error';
      default:
        return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 relative z-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="stars-small" />
        <div className="stars-medium" />
        <div className="stars-large" />
      </div>

      <div className="relative z-10 flex">
        <aside className="w-80 min-h-screen border-r border-white/10 bg-black/40 backdrop-blur-xl p-6">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold">Astral Evolution</h2>
                <p className="text-sm text-gray-400">Tu portal cósmico</p>
              </div>
            </div>

            <nav className="space-y-2">
              <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Mis Informes</span>
              </Link>

              <Link href="/dashboard/perfiles" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">
                <User className="w-5 h-5 text-gray-400" />
                <span>Mis Perfiles</span>
              </Link>

              <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">
                <User className="w-5 h-5 text-gray-400" />
                <span>Mi Cuenta</span>
              </Link>

              <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">
                <Plus className="w-5 h-5 text-gray-400" />
                <span>Nueva Consulta</span>
              </Link>
            </nav>

            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold text-sm">Próximamente</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Suscripciones y Horóscopos Diarios
                </p>
                <p className="text-xs text-gray-400">
                  Accede a lecturas personalizadas cada día
                </p>
                <Button disabled className="w-full" variant="outline">
                  Próximamente
                </Button>
              </div>
            </Card>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Mis Informes</h1>
              <p className="text-gray-400">Tu biblioteca de sabiduría cósmica</p>
            </div>

            {reports.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-12 text-center">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Comienza tu viaje</h2>
                    <p className="text-gray-400">
                      Aún no tienes informes astrológicos. Descubre los secretos del cosmos con tu primera lectura personalizada.
                    </p>
                  </div>
                  <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Link href="/">
                      <Plus className="w-5 h-5 mr-2" />
                      Adquirir mi primer informe
                    </Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {reports.map((report) => (
                  <Card key={report.id} className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors">
                    <div className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-8 h-8 text-blue-400" />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">
                            {report.transaction.product.name_es}
                          </h3>
                          <p className="text-sm text-gray-400 mb-2">
                            {new Date(report.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(report.status)}
                            <span className="text-sm font-medium">{getStatusText(report.status)}</span>
                          </div>
                        </div>

                        {report.status === 'generating' || report.status === 'pending' ? (
                          <div className="text-right">
                            <p className="text-sm text-blue-400 mb-1">Tu informe se está canalizando...</p>
                            <p className="text-xs text-gray-500">Te avisaremos por email cuando esté listo</p>
                          </div>
                        ) : null}
                      </div>

                      {report.status === 'completed' && (
                        <Button
                          onClick={() => handleViewReport(report)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 ml-4"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver reporte
                        </Button>
                      )}

                      {report.status === 'failed' && (
                        <Button variant="outline" className="ml-4" disabled>
                          Error en generación
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        .stars-small {
          width: 1px;
          height: 1px;
          background: transparent;
          box-shadow: ${Array.from({ length: 200 }, () =>
            `${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`
          ).join(',')};
          animation: animateStars 50s linear infinite;
        }

        .stars-medium {
          width: 2px;
          height: 2px;
          background: transparent;
          box-shadow: ${Array.from({ length: 100 }, () =>
            `${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`
          ).join(',')};
          animation: animateStars 100s linear infinite;
        }

        .stars-large {
          width: 3px;
          height: 3px;
          background: transparent;
          box-shadow: ${Array.from({ length: 50 }, () =>
            `${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`
          ).join(',')};
          animation: animateStars 150s linear infinite;
        }

        @keyframes animateStars {
          from { transform: translateY(0); }
          to { transform: translateY(-2000px); }
        }
      `}</style>
    </div>
  );
}
