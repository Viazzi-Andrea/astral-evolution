import Link from 'next/link';
import { CircleCheck as CheckCircle2, Mail, Sparkles } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 blur-3xl" />

            <div className="relative bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-3xl p-12">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-xl opacity-50" />
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                ¡Pago Exitoso!
              </h1>

              <p className="text-xl text-gray-300 mb-8">
                Tu informe astrológico está siendo generado
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold mb-2">Generación en Proceso</h3>
                    <p className="text-gray-400">
                      Nuestros astrólogos están analizando tu carta natal y creando tu informe personalizado.
                      Este proceso toma entre 10-30 minutos dependiendo del producto.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold mb-2">Revisa tu Email</h3>
                    <p className="text-gray-400">
                      Recibirás tu informe completo en formato PDF directamente en tu correo electrónico.
                      No olvides revisar tu carpeta de spam.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  ¿Algún problema? Contáctanos y te ayudaremos de inmediato.
                </p>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
