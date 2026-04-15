/**
 * lib/seo/metadata.ts
 * SEO localizado por país/región con las palabras que realmente busca cada mercado.
 * 
 * Investigación de términos por país:
 * - AR/UY: "carta natal gratis", "lectura astral", "astrología evolutiva", "carta natal online"
 * - MX: "carta astral", "horóscopo personalizado", "carta natal gratuita"
 * - CO/VE/PE: "carta natal", "horóscopo de hoy", "lectura del tarot" (competencia)
 * - CL: "carta natal chilena", "astrología online", "revolución solar"
 * - ES: "carta natal", "astrólogo online", "lectura astrológica"
 * - US (en español): "birth chart reading", "astrology reading online"
 */

import type { Metadata } from 'next';

// ─── Textos base por idioma/región ────────────────────────────────────────────

const SEO_BY_REGION = {
  // ── Argentina / Uruguay ──────────────────────────────────────────────────
  'ar-uy': {
    siteName: 'Astral Evolution',
    title: 'Astral Evolution — Carta Natal y Lectura Astrológica con IA',
    titleTemplate: '%s | Astral Evolution — Astrología Evolutiva',
    description:
      'Obtené tu carta natal personalizada con inteligencia artificial. Análisis profundo de tu Sol, Luna, Ascendente y tránsitos. Entrega en minutos. Astrología evolutiva para tu crecimiento personal.',
    keywords: [
      'carta natal online',
      'lectura astral personalizada',
      'astrología evolutiva Argentina',
      'carta natal gratis',
      'carta natal con IA',
      'análisis astrológico personalizado',
      'revolución solar',
      'sinastría pareja',
      'tránsitos astrológicos',
      'astrólogo online Uruguay',
      'lectura astrológica online',
      'carta natal 2025',
      'casa natal astrología',
      'quirón herida primordial',
      'nodos lunares',
    ],
    ogLocale: 'es_AR',
  },

  // ── México ────────────────────────────────────────────────────────────────
  'mx': {
    siteName: 'Astral Evolution',
    title: 'Astral Evolution — Carta Astral y Lectura Astrológica con IA',
    titleTemplate: '%s | Astral Evolution — Tu Carta Astral',
    description:
      'Descubre tu carta astral personalizada con inteligencia artificial. Análisis completo de tu Sol, Luna y Ascendente con los tránsitos actuales. Entrega en minutos desde cualquier lugar de México.',
    keywords: [
      'carta astral México',
      'carta natal gratuita',
      'lectura astrológica online',
      'horóscopo personalizado',
      'carta astral con inteligencia artificial',
      'astrología evolutiva',
      'astrólogo online México',
      'revolución solar análisis',
      'compatibilidad astrológica pareja',
      'lectura de carta natal 2025',
      'tránsitos planetarios',
      'nodos lunares propósito de vida',
    ],
    ogLocale: 'es_MX',
  },

  // ── Colombia / Venezuela / Perú ───────────────────────────────────────────
  'co-ve-pe': {
    siteName: 'Astral Evolution',
    title: 'Astral Evolution — Lectura Astrológica Personalizada con IA',
    titleTemplate: '%s | Astral Evolution — Astrología Online',
    description:
      'Tu carta natal y lectura astrológica generada con inteligencia artificial. Descubre tu propósito, tus talentos y los ciclos que marcan tu vida. Entrega inmediata online.',
    keywords: [
      'carta natal online Colombia',
      'lectura astrológica personalizada',
      'astrología online',
      'carta natal inteligencia artificial',
      'horóscopo natal',
      'astrólogo online',
      'compatibilidad astrológica',
      'lectura del cielo natal',
      'análisis astrológico 2025',
      'revolución solar',
    ],
    ogLocale: 'es_CO',
  },

  // ── Chile ─────────────────────────────────────────────────────────────────
  'cl': {
    siteName: 'Astral Evolution',
    title: 'Astral Evolution — Carta Natal y Astrología Evolutiva Online',
    titleTemplate: '%s | Astral Evolution — Astrología Chile',
    description:
      'Obtén tu carta natal completa y análisis astrológico evolutivo generado con IA. Sol, Luna, Ascendente, tránsitos y revolución solar. Entrega en minutos. Astrólogos online en Chile y todo el mundo.',
    keywords: [
      'carta natal Chile',
      'lectura astrológica online Chile',
      'astrología evolutiva',
      'astrólogo online Chile',
      'carta natal con IA',
      'revolución solar Chile',
      'análisis natal personalizado',
      'compatibilidad de pareja astrología',
    ],
    ogLocale: 'es_CL',
  },

  // ── España ────────────────────────────────────────────────────────────────
  'es': {
    siteName: 'Astral Evolution',
    title: 'Astral Evolution — Carta Natal y Lectura Astrológica con IA',
    titleTemplate: '%s | Astral Evolution — Astrología Evolutiva España',
    description:
      'Obtén tu carta natal y lectura astrológica personalizada generada con inteligencia artificial. Análisis profundo de tu Sol, Luna, Ascendente y ciclos planetarios. Entrega inmediata.',
    keywords: [
      'carta natal España',
      'lectura astrológica online',
      'astrólogo online',
      'carta natal con inteligencia artificial',
      'astrología evolutiva España',
      'análisis astrológico personalizado',
      'revolución solar',
      'sinastría pareja',
      'tránsitos 2025',
      'carta natal 2025 España',
    ],
    ogLocale: 'es_ES',
  },

  // ── EEUU (español) ────────────────────────────────────────────────────────
  'us-es': {
    siteName: 'Astral Evolution',
    title: 'Astral Evolution — Birth Chart & Astrology Reading with AI',
    titleTemplate: '%s | Astral Evolution — AI Astrology',
    description:
      'Get your personalized birth chart and astrology reading generated by AI. Deep analysis of your Sun, Moon, Rising and current transits. Delivered in minutes.',
    keywords: [
      'birth chart reading online',
      'astrology reading AI',
      'natal chart analysis',
      'personalized horoscope',
      'evolutionary astrology',
      'birth chart AI',
      'solar return reading',
      'synastry compatibility',
      'astrologer online',
      'birth chart 2025',
    ],
    ogLocale: 'en_US',
  },

  // ── Default (fallback) ────────────────────────────────────────────────────
  'default': {
    siteName: 'Astral Evolution',
    title: 'Astral Evolution — Carta Natal y Lectura Astrológica con IA',
    titleTemplate: '%s | Astral Evolution',
    description:
      'Tu carta natal y lectura astrológica personalizada generada con inteligencia artificial. Análisis profundo de tu Sol, Luna y Ascendente. Entrega inmediata.',
    keywords: [
      'carta natal',
      'lectura astrológica',
      'astrología evolutiva',
      'astrólogo online',
      'carta natal con IA',
      'revolución solar',
    ],
    ogLocale: 'es_ES',
  },
} as const;

// ─── Metadata base para Next.js app router ────────────────────────────────────

export const BASE_URL = 'https://astralevolution.com';

export function getBaseMetadata(region: keyof typeof SEO_BY_REGION = 'default'): Metadata {
  const seo = SEO_BY_REGION[region] ?? SEO_BY_REGION['default'];

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: seo.title,
      template: seo.titleTemplate,
    },
    description: seo.description,
    keywords: [...seo.keywords],
    authors: [{ name: 'Astral Evolution', url: BASE_URL }],
    creator: 'Astral Evolution',
    publisher: 'Astral Evolution',
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    openGraph: {
      type: 'website',
      siteName: seo.siteName,
      title: seo.title,
      description: seo.description,
      url: BASE_URL,
      locale: seo.ogLocale,
      images: [
        {
          url: `${BASE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: 'Astral Evolution — Lectura Astrológica con IA',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [`${BASE_URL}/og-image.jpg`],
      creator: '@astralevolution',
    },
    alternates: {
      canonical: BASE_URL,
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
  };
}

// ─── Metadata por producto ────────────────────────────────────────────────────

export const PRODUCT_METADATA: Record<string, { title: string; description: string; keywords: string[] }> = {
  'lectura-esencial': {
    title: 'Lectura Esencial — Sol, Luna y Ascendente con IA',
    description:
      'Análisis completo de tu Sol, Luna y Ascendente con los tránsitos del mes actual. El punto de partida ideal para conocer tu mapa astrológico. Entrega en 10-15 minutos.',
    keywords: [
      'lectura esencial astrológica',
      'análisis sol luna ascendente',
      'tránsitos del mes astrología',
      'carta natal básica',
      'lectura astrológica económica',
    ],
  },
  'consulta-evolutiva': {
    title: 'Consulta Evolutiva — Carta Natal Completa 10-15 páginas',
    description:
      'Tu carta natal completa: todos los planetas, las 12 casas, nodos lunares, Quirón, tránsitos anuales y revolución solar. El análisis astrológico más profundo. Entrega en 20-30 minutos.',
    keywords: [
      'carta natal completa',
      'consulta astrológica evolutiva',
      'análisis carta natal profundo',
      'revolución solar análisis',
      'nodos lunares karma',
      'quirón sanación',
      'tránsitos anuales',
    ],
  },
  'especial-parejas': {
    title: 'Especial Parejas — Sinastría Completa con IA',
    description:
      'Análisis completo de sinastría: compatibilidad, dinámicas relacionales, fortalezas y desafíos de tu pareja. Descubre el propósito de vuestra relación. Entrega en 25-35 minutos.',
    keywords: [
      'sinastría pareja astrología',
      'compatibilidad astrológica pareja',
      'análisis relacional carta natal',
      'sinastría online',
      'compatibilidad sol luna ascendente pareja',
    ],
  },
};

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Astral Evolution',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Plataforma de lecturas astrológicas personalizadas generadas con inteligencia artificial.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contacto@astralevolution.com',
      contactType: 'customer service',
      availableLanguage: ['Spanish', 'English', 'Portuguese'],
    },
    sameAs: [
      'https://www.instagram.com/astralevolution',
    ],
  };
}

export function getProductSchema(slug: string, price: number) {
  const meta = PRODUCT_METADATA[slug];
  if (!meta) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: meta.title,
    description: meta.description,
    url: `${BASE_URL}/productos/${slug}`,
    image: `${BASE_URL}/og-${slug}.jpg`,
    brand: { '@type': 'Brand', name: 'Astral Evolution' },
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Astral Evolution' },
    },
  };
}

export function getFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué es una carta natal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Una carta natal es un mapa del cielo en el momento exacto de tu nacimiento. Muestra la posición del Sol, la Luna y los planetas, revelando tu personalidad, talentos y propósito de vida.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo se genera la lectura?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Usamos inteligencia artificial avanzada (Google Gemini) para generar un análisis profundo y personalizado basado en los datos exactos de tu nacimiento. La entrega es en minutos.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuánto tarda en llegar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La Lectura Esencial llega en 10-15 minutos, la Consulta Evolutiva en 20-30 minutos, y el Especial Parejas en 25-35 minutos. Siempre a tu email.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué diferencia tiene con los horóscopos genéricos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nuestros análisis son 100% personalizados: usan tu fecha, hora y lugar de nacimiento exactos. No son predicciones genéricas sino un mapa único de tu energía y propósito.',
        },
      },
    ],
  };
}
