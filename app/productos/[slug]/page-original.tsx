'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product } from '@/lib/types/database';
import { supabase } from '@/lib/supabase/client';
import { BirthDataForm, BirthDataFormData } from '@/components/forms/birth-data-form';
import { calculateLocalPrice, getCountryFromIP } from '@/lib/pricing';
import { CircleCheck as CheckCircle2, Sparkles, Clock, FileText } from 'lucide-react';

const productDetails: Record<string, {
  features: string[];
  deliveryTime: string;
  pages: string;
  highlights: string[];
}> = {
  'lectura-esencial': {
    features: [
      'Análisis completo de Sol, Luna y Ascendente',
      'Interpretación de los tránsitos actuales del mes',
      'Guía de energías planetarias disponibles',
      'Recomendaciones personalizadas para el presente',
      'Formato PDF profesional',
    ],
    deliveryTime: '10-15 minutos',
    pages: '4-6 páginas',
    highlights: [
      'Ideal para comenzar tu camino astrológico',
      'Enfoque en tu presente y el mes actual',
      'Información clara y directa',
    ],
  },
  'consulta-evolutiva': {
    features: [
      'Carta natal completa con todos los planetas',
      'Análisis profundo de las 12 casas astrológicas',
      'Aspectos planetarios y su significado evolutivo',
      'Tránsitos importantes del año',
      'Nodos lunares y propósito kármico',
      'Quirón y heridas a sanar',
      'Revolución solar del año en curso',
      'Plan de crecimiento personalizado',
    ],
    deliveryTime: '20-30 minutos',
    pages: '10-15 páginas',
    highlights: [
      'Análisis profundo y transformador',
      'Perspectiva evolutiva y de crecimiento',
      'Herramienta para el autoconocimiento profundo',
    ],
  },
  'especial-parejas': {
    features: [
      'Sinastría completa entre ambas cartas natales',
      'Análisis de compatibilidad Sol, Luna y Ascendente',
      'Aspectos interplannetarios entre ambos',
      'Casas activadas en la relación',
      'Puntos de fortaleza de la pareja',
      'Áreas de crecimiento y desafíos',
      'Propósito compartido de la relación',
      'Recomendaciones para armonizar la convivencia',
    ],
    deliveryTime: '25-35 minutos',
    pages: '12-18 páginas',
    highlights: [
      'Comprensión profunda de la dinámica relacional',
      'Herramientas para crecer juntos',
      'Basado en datos exactos de ambos',
    ],
  },
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [countryCode, setCountryCode] = useState('US');
  const [pricing, setPricing] = useState({ amount: 0, currency: 'USD', currencySymbol: '$', formatted: '$0.00' });

  useEffect(() => {
    async function loadProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle();

      if (error || !data) {
        router.push('/');
        return;
      }

      setProduct(data);
      setLoading(false);
    }

    async function detectCountry() {
      const country = await getCountryFromIP();
      setCountryCode(country);
    }

    loadProduct();
    detectCountry();
  }, [slug, router]);

  useEffect(() => {
    if (product) {
      const localPricing = calculateLocalPrice(product.base_price_usd, countryCode);
      setPricing(localPricing);
    }
  }, [product, countryCode]);

  const handleFormSubmit = async (formData: BirthDataFormData) => {
    if (!product) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          birthData: formData,
          countryCode,
        }),
      });

      const { checkoutUrl, error } = await response.json();

      if (error) {
        alert('Error al crear la sesión de pago: ' + error);
        setSubmitting(false);
        return;
      }

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al procesar tu solicitud');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) return null;

  const details = productDetails[slug];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/10 mb-6">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-300">Análisis Personalizado con IA</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {product.name_es}
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              {product.description_es}
            </p>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-8">
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

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-8">
                <div className="text-center mb-6 pb-6 border-b border-white/10">
                  <div className="text-4xl font-bold text-white mb-2">{pricing.formatted}</div>
                  <div className="text-sm text-gray-400">Precio adaptado a tu región</div>
                </div>

                <div className="space-y-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span>Pago seguro con Stripe</span>
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

          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Completa tus Datos</h2>
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
