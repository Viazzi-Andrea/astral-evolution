'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BirthDataForm, BirthDataFormData } from '@/components/forms/birth-data-form';
import { calculateLocalPrice, getCountryFromIP } from '@/lib/pricing';
import { DiscountField } from '@/components/discount-field';
import { CircleCheck as CheckCircle2, Sparkles, Clock, FileText, ShieldCheck } from 'lucide-react';

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
    deliveryTime: '10-15 minutos',
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
    deliveryTime: '20-30 minutos',
    pages: '9 secciones',
    highlights: [
      'Análisis profundo y transformador',
      'Perspectiva evolutiva y de crecimiento',
      'La herramienta más completa para el autoconocimiento',
    ],
  },
  'especial-parejas': {
    features: [
      'Análisis de sinastría completo entre ambas cartas natales',
      'Compatibilidad profunda: Sol, Luna y Ascendente de ambos',
      'Los aspectos más significativos entre ambas cartas',
      'Lo que los une, lo que los tensiona, y cómo resolverlo',
      'El propósito compartido y el "ser" que nace de esta unión',
      'Orientación práctica para el momento actual de la relación',
      'Entrega completa por correo electrónico',
    ],
    deliveryTime: '25-35 minutos',
    pages: '8 secciones',
    highlights: [
      'Comprensión profunda de la dinámica relacional',
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
    setSubmitting(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

          {/* Formulario */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Completa tus Datos</h2>
              <DiscountField onDiscount={(pct, code) => { setDiscountPercent(pct); setDiscountCode(code); }} />
              <BirthDataForm
                onSubmit={handleFormSubmit}
                isLoading={submitting}
                showPartnerFields={product.requires_partner_data}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
