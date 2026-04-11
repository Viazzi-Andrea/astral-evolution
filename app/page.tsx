'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Moon, Sun, Star, LayoutDashboard } from 'lucide-react';
import { FloatingOrbs } from '@/components/ui/floating-orbs';
import { supabase } from '@/lib/supabase/client';

export default function HomeDebug() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Home - Session check:', session ? 'Logged in' : 'Not logged in');
      setIsLoggedIn(!!session);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigate = (url: string) => {
    console.log('🔵 Navigating to:', url);
    window.location.href = url;
  };

  const scrollToPlans = () => {
    const plansSection = document.getElementById('plans-section');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative">
      <FloatingOrbs />
      <section className="relative container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/10 mb-8 animate-float">
            <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
            <span className="text-sm text-blue-300">Astrología de Precisión Evolutiva</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
            Tu Mapa Celestial<br />Decodificado con IA
          </h1>

          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Informes astrológicos personalizados que combinan sabiduría milenaria con inteligencia artificial avanzada.
            Descubre tu propósito evolutivo con precisión científica.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!loading && isLoggedIn && (
              <button
                onClick={() => navigate('/dashboard')}
                className="group relative px-8 py-4 rounded-lg bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 text-white font-bold hover:from-emerald-600 hover:to-teal-600 transition-all inline-flex items-center justify-center gap-3 border-none cursor-pointer shadow-xl shadow-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/60 hover:scale-105"
              >
                <LayoutDashboard className="h-6 w-6" />
                Ir a mis informes
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            <button
              onClick={scrollToPlans}
              className="group relative px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all inline-flex items-center justify-center gap-2 border-none cursor-pointer"
            >
              Ver todos los planes
              <ArrowRight className="h-5 w-5 group-hover:translate-y-1 transition-transform rotate-90" />
            </button>
          </div>
        </div>
      </section>

      <section id="plans-section" className="relative container mx-auto px-4 py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Elige tu lectura
          </h2>
          <p className="text-xl text-gray-400">
            Selecciona el análisis que mejor se adapte a tu búsqueda
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:border-blue-500/30 transition-all">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Sun className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lectura Esencial</h3>
              <p className="text-gray-400 mb-4">
                Análisis completo de tu Sol, Luna y Ascendente con los tránsitos actuales del mes.
              </p>
              <div className="text-2xl font-bold text-blue-400 mb-4">Desde USD10.50</div>
              <button
                onClick={() => navigate('/productos/lectura-esencial')}
                className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-2 group/link bg-transparent border-none cursor-pointer"
              >
                Ver más
                <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:border-purple-500/30 transition-all">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Moon className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Consulta Evolutiva</h3>
              <p className="text-gray-400 mb-4">
                Dossier completo de 10-15 páginas con tu carta natal, casas y tránsitos anuales.
              </p>
              <div className="text-2xl font-bold text-purple-400 mb-4">Desde USD26.60</div>
              <button
                onClick={() => navigate('/productos/consulta-evolutiva')}
                className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-2 group/link bg-transparent border-none cursor-pointer"
              >
                Ver más
                <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:border-cyan-500/30 transition-all">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6">
                <Star className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Especial Parejas</h3>
              <p className="text-gray-400 mb-4">
                Análisis de sinastría completo revelando la dinámica y compatibilidad de la relación.
              </p>
              <div className="text-2xl font-bold text-cyan-400 mb-4">Desde USD38.50</div>
              <button
                onClick={() => navigate('/productos/especial-parejas')}
                className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-2 group/link bg-transparent border-none cursor-pointer"
              >
                Ver más
                <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              ¿Por qué elegir Astral Evolution?
            </h2>
            <p className="text-xl text-gray-400">
              Precisión técnica, profundidad evolutiva
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Análisis con IA Avanzada</h3>
                <p className="text-gray-400">
                  Utilizamos modelos de inteligencia artificial de última generación para interpretar tu carta natal con precisión sin precedentes.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Moon className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Entrega Instantánea</h3>
                <p className="text-gray-400">
                  Recibe tu informe astrológico completo en PDF directamente en tu correo en minutos.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Personalización Total</h3>
                <p className="text-gray-400">
                  Cada informe es único y generado específicamente para ti, basado en tus datos exactos de nacimiento.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Sun className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Visión Evolutiva</h3>
                <p className="text-gray-400">
                  No solo leemos tu carta: te mostramos tu camino de crecimiento y transformación personal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Listo para descubrir tu camino?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Comienza tu viaje de autoconocimiento con un análisis astrológico personalizado
              </p>
              <button
                onClick={scrollToPlans}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all border-none cursor-pointer"
              >
                Comenzar ahora
                <ArrowRight className="h-5 w-5 -rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
