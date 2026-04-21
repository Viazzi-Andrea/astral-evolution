'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, CheckCircle, Clock, Mail, RefreshCw } from 'lucide-react';

type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'not_found' | 'loading';

export default function GraciasPage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const status = searchParams.get('status');

  const [reportStatus, setReportStatus] = useState<ReportStatus>('loading');
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!transactionId) return;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/report-status?transactionId=${transactionId}`);
        if (!res.ok) {
          setReportStatus('not_found');
          return;
        }
        const data = await res.json();
        setReportStatus(data.status ?? 'pending');
      } catch {
        setReportStatus('pending');
      }
    }

    checkStatus();

    // Polling cada 15 segundos, máximo 10 veces (2.5 min)
    const interval = setInterval(() => {
      setPollCount((c) => {
        if (c >= 10) {
          clearInterval(interval);
          return c;
        }
        checkStatus();
        return c + 1;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [transactionId]);

  const isPending = status === 'pending';

  return (
    <main className="min-h-screen flex items-center justify-center py-20 px-4">
      {/* Fondo estrellas */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.6 + 0.2,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 3 + 's',
            }}
          />
        ))}
      </div>

      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
        }
      `}</style>

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Icono principal */}
        <div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            animation: 'float 3s ease-in-out infinite, pulse-glow 3s ease-in-out infinite',
          }}
        >
          {isPending ? (
            <Clock className="w-12 h-12 text-yellow-400" />
          ) : (
            <CheckCircle className="w-12 h-12 text-green-400" />
          )}
        </div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-300 bg-clip-text text-transparent">
          {isPending ? '¡Pago en Proceso!' : '¡Pago Exitoso!'}
        </h1>

        <p className="text-xl text-gray-300 mb-8">
          {isPending
            ? 'Tu pago está siendo procesado. Recibirás tu lectura cuando se confirme.'
            : 'Tu lectura astrológica está siendo preparada con amor y precisión.'}
        </p>

        {/* Estado del reporte */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-white">Estado de tu Reporte</h2>
          </div>

          {reportStatus === 'loading' && (
            <div className="flex items-center gap-3 text-gray-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verificando estado...</span>
            </div>
          )}

          {(reportStatus === 'pending' || reportStatus === 'generating') && (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-purple-400"
                    style={{ animation: `pulse 1s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <span className="text-purple-300">
                {reportStatus === 'generating'
                  ? 'Estamos preparando tu lectura astrológica...'
                  : 'Tu reporte está en cola de generación...'}
              </span>
            </div>
          )}

          {reportStatus === 'completed' && (
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>¡Tu reporte fue generado exitosamente!</span>
            </div>
          )}

          {reportStatus === 'failed' && (
            <div className="text-red-400 text-sm">
              Hubo un problema generando tu reporte. Nuestro equipo lo resolverá pronto.
            </div>
          )}

          {reportStatus === 'not_found' && (
            <div className="text-yellow-400 text-sm">
              Procesando tu pedido... Esto puede tomar unos minutos.
            </div>
          )}
        </div>

        {/* Info de entrega */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-white">¿Qué sigue?</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-400 text-left">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-purple-300">1</div>
              <span>Tu lectura astrológica está siendo preparada de forma personalizada para vos.</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-purple-300">2</div>
              <span>Recibirás un email con tu reporte completo en los próximos 10-30 minutos.</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-purple-300">3</div>
              <span>Si tenés dudas, escribinos a <span className="text-purple-400">contacto@astralevolution.com</span></span>
            </div>
          </div>
        </div>

        <button
          onClick={() => (window.location.href = '/')}
          className="px-8 py-3 rounded-full font-medium transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(59, 130, 246, 0.4))',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            color: 'white',
          }}
        >
          Volver al inicio ✨
        </button>
      </div>
    </main>
  );
}
