'use client';

import { ArrowRight, Sun, Moon, Star, Check } from 'lucide-react';

export default function PreciosPage() {
  const navigate = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
            Planes y Precios
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Análisis astrológicos profesionales diseñados para cada etapa de tu viaje de autoconocimiento.
            Precios ajustados según tu región.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto mb-16">
          <div className="group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:border-blue-500/30 transition-all">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Sun className="h-8 w-8 text-blue-400" />
              </div>

              <h3 className="text-2xl font-bold mb-2">Lectura Esencial</h3>
              <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-6">
                Desde <span className="text-2xl sm:text-3xl">USD$10.50</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Análisis completo de Sol, Luna y Ascendente</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Aspectos más significativos de tu carta natal</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Carta natal con cálculos astronómicos exactos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Entrega instantánea por email</span>
                </li>
              </ul>

              <button
                onClick={() => navigate('/productos/lectura-esencial')}
                className="w-full px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all inline-flex items-center justify-center gap-2 border-none cursor-pointer"
              >
                Obtener ahora
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="group relative p-8 rounded-2xl border-2 border-purple-500/50 bg-gradient-to-b from-purple-500/10 to-transparent hover:border-purple-500/70 transition-all">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold">
              Más Popular
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Moon className="h-8 w-8 text-purple-400" />
              </div>

              <h3 className="text-2xl font-bold mb-2">Consulta Evolutiva</h3>
              <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-6">
                Desde <span className="text-2xl sm:text-3xl">USD$26.60</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Carta natal completa con todos los planetas</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Análisis detallado de las 12 casas</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Nodo Norte: propósito kármico del alma</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Síntesis del proyecto de vida</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Entrega instantánea por email</span>
                </li>
              </ul>

              <button
                onClick={() => navigate('/productos/consulta-evolutiva')}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all inline-flex items-center justify-center gap-2 border-none cursor-pointer shadow-lg shadow-purple-500/30"
              >
                Obtener ahora
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:border-cyan-500/30 transition-all">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6">
                <Star className="h-8 w-8 text-cyan-400" />
              </div>

              <h3 className="text-2xl font-bold mb-2">Especial Parejas</h3>
              <div className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-6">
                Desde <span className="text-2xl sm:text-3xl">USD$38.50</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Análisis de sinastría completo</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Compatibilidad entre ambas cartas natales</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Dinámicas de relación y desafíos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Aspectos interplanetarios y propósito compartido</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Entrega instantánea por email</span>
                </li>
              </ul>

              <button
                onClick={() => navigate('/productos/especial-parejas')}
                className="w-full px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-all inline-flex items-center justify-center gap-2 border-none cursor-pointer"
              >
                Obtener ahora
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent">
            <h2 className="text-2xl font-bold mb-6 text-center">Preguntas Frecuentes sobre Precios</h2>

            <div className="space-y-6 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">¿Por qué los precios varían según la región?</h3>
                <p>
                  Ajustamos los precios según el poder adquisitivo de cada región para hacer nuestros servicios
                  accesibles a personas de todo el mundo. Los precios mostrados en USD son convertidos automáticamente
                  según tu ubicación.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">¿Qué métodos de pago aceptan?</h3>
                <p>
                  Aceptamos todas las principales tarjetas de crédito y débito a través de nuestra plataforma segura
                  de pagos Mercado Pago. El procesamiento es instantáneo y seguro.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">¿Cuándo recibo mi informe?</h3>
                <p>
                  Tu informe se genera automáticamente y se envía a tu correo electrónico inmediatamente después de
                  completar el pago. Revisa tu carpeta de spam si no lo recibes en los primeros minutos.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">¿Puedo comprar múltiples informes?</h3>
                <p>
                  Sí, puedes comprar tantos informes como desees para ti o como regalo. Cada informe es único y
                  personalizado según los datos de nacimiento proporcionados.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">¿Ofrecen garantía de satisfacción?</h3>
                <p>
                  Estamos comprometidos con la calidad de nuestros informes. Si encuentras algún problema técnico o
                  no recibes tu informe, contáctanos y lo resolveremos de inmediato. Consulta nuestra política de
                  reembolsos para más detalles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
