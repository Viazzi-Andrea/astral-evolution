'use client';

import { useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw, MessageCircle } from 'lucide-react';

export default function PagoFallidoPage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId');

  return (
    <main className="min-h-screen flex items-center justify-center py-20 px-4">
      {/* Fondo estrellas */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.4 + 0.1,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Icono */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <XCircle className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
          El pago no se completó
        </h1>

        <p className="text-gray-400 text-lg mb-10">
          No se realizó ningún cobro. Podés intentarlo nuevamente cuando quieras.
        </p>

        {/* Opciones */}
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-medium transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(59, 130, 246, 0.3))',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              color: 'white',
            }}
          >
            <RefreshCw className="w-5 h-5" />
            Intentar nuevamente
          </button>

          <a
            href="/"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-medium transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#9ca3af',
            }}
          >
            Volver al inicio
          </a>

          <a
            href="mailto:contacto@astralevolution.com"
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-sm transition-all duration-300"
            style={{ color: '#6b7280' }}
          >
            <MessageCircle className="w-4 h-4" />
            ¿Necesitás ayuda? Contactanos
          </a>
        </div>

        {transactionId && (
          <p className="mt-8 text-xs text-gray-600">
            Referencia: {transactionId}
          </p>
        )}
      </div>
    </main>
  );
}
