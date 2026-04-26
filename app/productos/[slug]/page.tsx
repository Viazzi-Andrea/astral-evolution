'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BirthDataForm, BirthDataFormData } from '@/components/forms/birth-data-form';
import { calculateLocalPrice, getCountryFromIP } from '@/lib/pricing';
import { DiscountField } from '@/components/discount-field';
import { CircleCheck as CheckCircle2, Sparkles, Clock, FileText, ShieldCheck, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Session } from '@supabase/supabase-js';

// Supabase NO se usa desde el cliente.
// Todo el acceso a la BD ocurre en /api/checkout (service_role, bypasea RLS).

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  slug: string;
  name_es: string;
  name_en: string;
  name_pt: string;
  description_es: string;
  description_en: string;
  description_pt: string;
  base_price_usd: number;
  prompt_template: string;
  active: boolean;
  requires_partner_data: boolean;
  created_at: string;
}

// ─── Datos de productos (sin DB call — evita exponer service key al cliente) ──
const hardcodedProducts: Record<string, Product> = {
  'lectura-esencial': {
    id: 'e53d85c4-3599-4a82-80d8-5d313fc3c916',
    slug: 'lectura-esencial',
    name_es: 'Lectura Esencial',
    name_en: 'Essential Reading',
    name_pt: 'Leitura Essencial',
    description_es: 'Análisis completo de tu Sol, Luna y Ascendente con los tránsitos actuales del mes.',
    description_en: 'Complete analysis of your Sun, Moon and Rising with current transits.',
    description_pt: 'Análise completa do seu Sol, Lua e Ascendente com os trânsitos atuais.',
    base_price_usd: 10.50,
    prompt_template: '',
    active: true,
    requires_partner_data: false,
    created_at: new Date().toISOString(),
  },
  'consulta-evolutiva': {
    id: 'e1c9e6a0-2e6a-41b4-a741-c413b6c955f8',
    slug: 'consulta-evolutiva',
    name_es: 'Consulta Evolutiva',
    name_en: 'Evolutionary Consultation',
    name_pt: 'Consulta Evolutiva',
    description_es: 'Dossier completo de 10-15 páginas con tu carta natal, casas y tránsitos anuales.',
    description_en: 'Complete dossier of 10-15 pages with your natal chart, houses and annual transits.',
    description_pt: 'Dossiê completo de 10-15 páginas com seu mapa natal, casas e trânsitos anuais.',
    base_price_usd: 26.60,
    prompt_template: '',
    active: true,
    requires_partner_data: false,
    created_at: new Date().toISOString(),
  },
  'especial-parejas': {
    id: '930bfe28-0c0f-433e-84bd-3cc57827aafa',
    slug: 'especial-parejas',
    name_es: 'Especial Parejas',
    name_en: 'Couples Special',
    name_pt: 'Especial Casais',
    description_es: 'Análisis de sinastría completo revelando la dinámica y compatibilidad de la relación.',
    description_en: 'Complete synastry analysis revealing relationship dynamics and compatibility.',
    description_pt: 'Análise de sinastria completa revelando a dinâmica e compatibilidade do relacionamento.',
    base_price_usd: 38.50,
    prompt_template: '',
    active: true,
    requires_partner_data: true,
    created_at: new Date().toISOString(),
  },
};

const productDetails: Record<string, {
  features: string[];
  deliveryTime: string;
  pages: string;
  highlights: string[];
}> = {
  'lectura-esencial': {
    features: [
      'Interpretación psicológica de Sol, Luna y Ascendente',
      'Configuración energética de tu carta (elemento y modalidad dominante)',
      'El aspecto más significativo de tu vida interior',
      'Cálculos astronómicos exactos con algoritmos Meeus/VSOP87',
      'Tu mensaje evolutivo personalizado',
      'Entrega completa por correo electrónico',
    ],
    deliveryTime: 'menos de 2 minutos',
    pages: '5 secciones',
    highlights: [
      'Ideal para comenzar tu camino astrológico',
      'Profundidad psicológica real, no horóscopo genérico',
      'Información clara, directa y personalizada',
    ],
  },
  'consulta-evolutiva': {
    features: [
      'Todos los planetas (Sol a Plutón): posición, casa y significado evolutivo',
      'Análisis de las 12 casas astrológicas (sistema Plácido)',
      'Los 5 aspectos más significativos y cómo integrarlos',
      'Nodo Norte: propósito kármico y dirección del alma',
      'Las casas angulares y el eje de vida',
      'Síntesis de tu proyecto de vida',
      'Orientación práctica personalizada con tu contexto',
      'Entrega completa por correo electrónico',
    ],
    deliveryTime: '2-5 minutos',
    pages: '9 secciones',
    highlights: [
      'Análisis profundo y transformador',
      'Perspectiva evolutiva y de crecimiento',
      'La herramienta más completa para el autoconocimiento',
    ],
  },
  'especial-parejas': {
    features: [
      'Sinastría natal completa: los aspectos exactos entre ambas cartas',
      'Carta Compuesta (método de puntos medios): la identidad del vínculo',
      'Carta de Davison: el punto de encuentro en el tiempo y el espacio',
      'Carta Dracónica: el propósito del alma detrás de este encuentro',
      'Cartas Progresadas actuales: qué está evolucionando en cada persona ahora',
      'Tránsitos del cielo actual sobre el vínculo: lo que atraviesan juntos',
      'Identificación de aspectos de "Destino Inevitable"',
      'Análisis kármico: Nodos Lunares y el Sanador Interior',
      'Entrega completa por correo electrónico',
    ],
    deliveryTime: '3-6 minutos',
    pages: '11 secciones',
    highlights: [
      'Análisis multidimensional: 6 cartas diferentes del vínculo',
      'Honestidad sobre desafíos y sobre los regalos del vínculo',
      'Basado en datos astronómicos exactos de ambos',
    ],
  },
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('UY');
  const [pricing, setPricing] = useState({
    amount: 0,
    currency: 'USD',
    currencySymbol: '$',
    formatted: '$0.00',
  });

  // ── Auth state ───────────────────────────────────────────────────────────────
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // ── Verificar sesión de auth ─────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleForgotPassword = async () => {
    if (!authEmail) { setAuthError('Ingresá tu email primero.'); return; }
    setAuthSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setAuthSubmitting(false);
    if (error) { setAuthError(error.message); return; }
    setResetSent(true);
    setAuthError(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
      } else {
        const redirectTo = typeof window !== 'undefined'
          ? `${window.location.origin}/productos/${slug}`
          : `https://astralevolution.com/productos/${slug}`;
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        setAuthError('Te enviamos un email de confirmación. Revisá tu bandeja de entrada y hacé clic en el link para continuar.');
        setAuthSubmitting(false);
        return;
      }
    } catch (err: any) {
      setAuthError(err.message ?? 'Error de autenticación');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // ── Carga del producto (solo del fallback hardcodeado — sin llamar a Supabase)
  useEffect(() => {
    async function loadProduct() {
      try {
        if (hardcodedProducts[slug]) {
          setProduct(hardcodedProducts[slug]);
        } else {
          setError('Producto no encontrado');
        }
      } catch (err) {
        console.error('Error cargando producto:', err);
        setError('Error inesperado al cargar el producto');
      } finally {
        setLoading(false);
      }
    }

    async function detectCountry() {
      const country = await getCountryFromIP();
      setCountryCode(country);
    }

    loadProduct();
    detectCountry();
  }, [slug]);

  useEffect(() => {
    if (product) {
      const basePrice = product.base_price_usd * (1 - discountPercent / 100);
      const localPricing = calculateLocalPrice(basePrice, countryCode, slug);
      setPricing(localPricing);
    }
  }, [product, countryCode, slug]);

  // ── Submit: manda todo al servidor → /api/checkout hace el resto ─────────────
  const handleFormSubmit = async (formData: BirthDataFormData, partnerData?: Partial<BirthDataFormData>) => {
    if (!product) return;
    if (!authSession) {
      alert('Debes iniciar sesión para continuar.');
      return;
    }
    setSubmitting(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          productSlug: product.slug,
          productId: product.id,
          birthData: formData,
          partnerBirthData: partnerData ?? undefined,
          countryCode,
          amount: pricing.amount,
          discountCode: discountCode ?? undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const msg = data.details
          ? `${data.error}\n\nDetalles: ${data.details}`
          : data.error ?? 'Error al crear el pago';
        alert(msg);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error('Error en checkout:', err);
      alert('Ocurrió un error al procesar tu solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Estados de carga / error ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-300 mb-8">{error ?? 'Producto no encontrado'}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const details = productDetails[slug];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">

          {/* Cabecera */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/10 mb-6">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-300">Auditoría Astral Personalizada</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {product.name_es}
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              {product.description_es}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <span>Entrega en {details?.deliveryTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                <span>{details?.pages}</span>
              </div>
            </div>
          </div>

          {/* Cuerpo: features + precio */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-4 sm:p-8">
                <h2 className="text-2xl font-bold mb-6">¿Qué Incluye?</h2>
                <div className="space-y-3">
                  {details?.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="text-xl font-semibold mb-4">Por Qué Elegir Esta Lectura</h3>
                  <div className="space-y-3">
                    {details?.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                        <span className="text-gray-300">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de precio */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-4 sm:p-8">
                <div className="text-center mb-6 pb-6 border-b border-white/10">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{pricing.formatted} USD</div>
                  <div className="text-sm text-gray-400">Precio adaptado a tu región</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Los cargos se procesan en Dólares Estadounidenses
                  </div>
                </div>

                <div className="space-y-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-400" />
                    <span>Pago seguro con Mercado Pago</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span>Entrega inmediata por email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span>100% personalizado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario / Gate de autenticación */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-8">

              {authLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                </div>
              ) : !authSession ? (
                /* Gate de autenticación */
                <div className="max-w-sm mx-auto">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 mb-4">
                      <LogIn className="h-7 w-7 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Crea tu cuenta</h2>
                    <p className="text-gray-400 text-sm">
                      Necesitás una cuenta para guardar tu lectura y acceder a ella cuando quieras.
                    </p>
                  </div>

                  <div className="flex rounded-lg border border-white/10 mb-6 overflow-hidden">
                    <button
                      onClick={() => { setAuthMode('login'); setAuthError(null); }}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${authMode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Iniciar sesión
                    </button>
                    <button
                      onClick={() => { setAuthMode('register'); setAuthError(null); }}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${authMode === 'register' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Crear cuenta
                    </button>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="auth-email">Email</Label>
                      <Input
                        id="auth-email"
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auth-password">Contraseña</Label>
                      <Input
                        id="auth-password"
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="••••••••"
                      />
                      {authMode === 'register' && (
                        <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
                      )}
                    </div>

                    {authError && (
                      <p className={`text-sm ${authError.includes('confirmación') ? 'text-green-400' : 'text-red-400'}`}>
                        {authError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      {authSubmitting ? 'Procesando...' : authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                    </Button>

                    {authMode === 'login' && !resetSent && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={authSubmitting}
                        className="w-full text-sm text-gray-400 hover:text-white transition-colors text-center"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                    {resetSent && (
                      <p className="text-sm text-green-400 text-center">
                        Te enviamos un link para restablecer tu contraseña. Revisá tu email.
                      </p>
                    )}
                  </form>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Tu cuenta es gratuita. Guardamos tus lecturas de forma segura.
                  </p>
                </div>
              ) : (
                /* Formulario de datos de nacimiento (usuario autenticado) */
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Completa tus Datos</h2>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      {authSession.user.email}
                    </div>
                  </div>
                  <DiscountField onDiscount={(pct, code) => { setDiscountPercent(pct); setDiscountCode(code); }} />
                  <BirthDataForm
                    onSubmit={handleFormSubmit}
                    isLoading={submitting}
                    showPartnerFields={product.requires_partner_data}
                  />
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
