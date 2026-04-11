# Astral Evolution - Plataforma SaaS de Astrología Evolutiva

Una plataforma moderna de astrología evolutiva automatizada que genera informes personalizados usando IA.

## Características

- 🌟 **3 Tipos de Lecturas Astrológicas**
  - Lectura Esencial: Análisis rápido de Sol, Luna y Ascendente
  - Consulta Evolutiva: Análisis profundo de carta natal completa (10-15 páginas)
  - Especial Parejas: Análisis de sinastría y compatibilidad

- 💳 **Pagos Globales con Stripe**
  - Precios dinámicos por región geográfica
  - Detección automática de ubicación
  - Checkout seguro

- 🤖 **Generación con IA**
  - Integración con Google Gemini o Claude 3.5 Sonnet
  - Prompts diferenciados por tipo de producto
  - Análisis personalizados

- 📧 **Entrega Automatizada**
  - Generación de PDF profesional
  - Envío automático por email
  - Entrega en 10-30 minutos

- 🎨 **Diseño Moderno**
  - UI minimalista y futurista
  - Efectos visuales tipo aurora
  - Responsive en todos los dispositivos

## Stack Tecnológico

- **Frontend**: Next.js 13 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Pagos**: Stripe
- **IA**: Google Gemini / Claude 3.5 Sonnet
- **Email**: SendGrid

## Instalación

1. Clona el repositorio
\`\`\`bash
git clone [repository-url]
cd astral-evolution
\`\`\`

2. Instala las dependencias
\`\`\`bash
npm install
\`\`\`

3. Configura las variables de entorno

Copia el archivo \`.env.example\` a \`.env\` y completa los valores:

\`\`\`bash
cp .env.example .env
\`\`\`

### Variables de Entorno Requeridas

#### Supabase
- \`NEXT_PUBLIC_SUPABASE_URL\`: URL de tu proyecto Supabase
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`: Clave anónima de Supabase
- \`SUPABASE_SERVICE_ROLE_KEY\`: Clave de servicio de Supabase

#### Stripe
- \`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\`: Clave pública de Stripe
- \`STRIPE_SECRET_KEY\`: Clave secreta de Stripe
- \`STRIPE_WEBHOOK_SECRET\`: Secret del webhook de Stripe

#### IA (elige una)
- \`GEMINI_API_KEY\`: API key de Google Gemini
- \`ANTHROPIC_API_KEY\`: API key de Claude (Anthropic)

#### Email
- \`SENDGRID_API_KEY\`: API key de SendGrid
- \`SENDGRID_FROM_EMAIL\`: Email remitente verificado

#### App
- \`NEXT_PUBLIC_APP_URL\`: URL de tu aplicación

4. Ejecuta las migraciones de base de datos

Las migraciones ya fueron aplicadas automáticamente. La base de datos incluye:
- Tabla de usuarios
- Tabla de datos de nacimiento
- Tabla de productos (3 productos pre-cargados)
- Tabla de transacciones
- Tabla de reportes

5. Inicia el servidor de desarrollo

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en \`http://localhost:3000\`

## Configuración de Stripe

1. Crea una cuenta en [Stripe](https://stripe.com)
2. Obtén tus API keys en el Dashboard
3. Configura el webhook:
   - URL: \`https://tu-dominio.com/api/webhooks/stripe\`
   - Eventos a escuchar: \`checkout.session.completed\`
4. Copia el webhook secret a tu \`.env\`

## Configuración de la IA

### Opción 1: Google Gemini
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una API key
3. Agrégala a \`GEMINI_API_KEY\` en tu \`.env\`

### Opción 2: Claude (Anthropic)
1. Ve a [Anthropic Console](https://console.anthropic.com/)
2. Crea una API key
3. Agrégala a \`ANTHROPIC_API_KEY\` en tu \`.env\`

## Estructura del Proyecto

\`\`\`
/app
  /api
    /checkout         # API para crear sesiones de Stripe
    /webhooks
      /stripe         # Webhook para pagos completados
  /productos
    /[slug]          # Páginas dinámicas de productos
  /exito             # Página de confirmación
  page.tsx           # Homepage
  layout.tsx         # Layout principal

/components
  /forms
    birth-data-form.tsx  # Formulario de datos de nacimiento
  /layout
    header.tsx       # Header de navegación
    footer.tsx       # Footer

/lib
  /ai
    prompts.ts       # Prompts maestros para la IA
    generate-report.ts  # Lógica de generación de reportes
  /pdf
    generator.ts     # Generación de PDFs
  /supabase
    client.ts        # Cliente Supabase para frontend
    server.ts        # Cliente Supabase con privilegios
  /types
    database.ts      # Tipos TypeScript
  pricing.ts         # Lógica de precios dinámicos
\`\`\`

## Productos Disponibles

### 1. Lectura Esencial - $15 USD
- Sol, Luna y Ascendente
- Tránsitos del mes actual
- 4-6 páginas

### 2. Consulta Evolutiva - $38 USD
- Carta natal completa
- Todas las casas y planetas
- Tránsitos anuales
- 10-15 páginas

### 3. Especial Parejas - $55 USD
- Sinastría completa
- Análisis de compatibilidad
- Dinámicas relacionales
- 12-18 páginas

## Precios Dinámicos por Región

- **América Latina**: 70% del precio base
- **Europa**: 120% del precio base
- **Norteamérica**: 100% del precio base
- **Resto del mundo**: 100% del precio base

## Desarrollo

\`\`\`bash
# Modo desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint
\`\`\`

## Flujo de Usuario

1. Usuario visita la homepage
2. Selecciona un producto
3. Completa el formulario con datos de nacimiento
4. Realiza el pago via Stripe
5. Sistema detecta el pago exitoso via webhook
6. IA genera el informe personalizado
7. Sistema crea el PDF
8. Email con el PDF se envía automáticamente

## Seguridad

- Row Level Security (RLS) activado en todas las tablas
- Validación de datos en frontend y backend
- Webhooks verificados con firma
- Variables sensibles en variables de entorno

## Próximas Funcionalidades

- [ ] Internacionalización (i18n) completa para EN y PT
- [ ] Dashboard de usuario para ver historial
- [ ] Integración con más pasarelas de pago
- [ ] Sistema de afiliados
- [ ] App móvil

## Licencia

Propietario - Todos los derechos reservados

## Soporte

Para soporte, contacta a: soporte@astralevolution.com
