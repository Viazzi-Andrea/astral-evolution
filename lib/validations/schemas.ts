/**
 * lib/validations/schemas.ts
 * Zod schemas para todos los puntos de entrada de la aplicación.
 * Si un dato no cumple el formato, se rechaza ANTES de tocar la DB o la API.
 */

import { z } from 'zod';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const nonEmptyString = (field: string) =>
  z.string({ required_error: `${field} es requerido` }).trim().min(1, `${field} no puede estar vacío`);

const safeString = (field: string, maxLen = 200) =>
  nonEmptyString(field)
    .max(maxLen, `${field} excede el largo máximo (${maxLen} caracteres)`)
    .refine((v) => !/[<>'"`;]/.test(v), `${field} contiene caracteres no permitidos`);

// ─── Birth Data ───────────────────────────────────────────────────────────────

export const BirthDataSchema = z.object({
  name: safeString('Nombre', 100),
  email: z
    .string({ required_error: 'Email es requerido' })
    .trim()
    .email('Formato de email inválido')
    .max(254, 'Email demasiado largo')
    .toLowerCase(),
  birthDate: z
    .string({ required_error: 'Fecha de nacimiento es requerida' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .refine((v) => {
      const d = new Date(v);
      const now = new Date();
      const minDate = new Date('1900-01-01');
      return d >= minDate && d <= now;
    }, 'Fecha de nacimiento fuera de rango'),
  birthTime: z
    .string({ required_error: 'Hora de nacimiento es requerida' })
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido (HH:MM)'),
  birthCity: safeString('Ciudad de nacimiento', 100),
  birthCountry: safeString('País de nacimiento', 100),
  personalContext: z
    .string()
    .max(1000, 'El contexto personal no puede superar 1000 caracteres')
    .refine((v) => !/<script/i.test(v), 'Contenido no permitido')
    .optional()
    .nullable(),
  language: z.enum(['es', 'en', 'pt']).default('es'),
});

export type BirthDataInput = z.infer<typeof BirthDataSchema>;

// ─── Partner Birth Data (Especial Parejas) ───────────────────────────────────

export const PartnerBirthDataSchema = BirthDataSchema.omit({ email: true, language: true }).extend({
  name: safeString('Nombre de la pareja', 100),
});

export type PartnerBirthDataInput = z.infer<typeof PartnerBirthDataSchema>;

// ─── Checkout Request ─────────────────────────────────────────────────────────

export const CheckoutRequestSchema = z.object({
  productSlug: z.enum(['lectura-esencial', 'consulta-evolutiva', 'especial-parejas'], {
    errorMap: () => ({ message: 'Producto inválido' }),
  }),
  birthData: BirthDataSchema,
  partnerBirthData: PartnerBirthDataSchema.optional().nullable(),
  countryCode: z
    .string()
    .length(2, 'Código de país inválido')
    .toUpperCase()
    .default('US'),
});

export type CheckoutRequestInput = z.infer<typeof CheckoutRequestSchema>;

// ─── Mercado Pago Webhook ─────────────────────────────────────────────────────

export const MercadoPagoWebhookSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string(),
  action: z.string().optional(),
  data: z
    .object({
      id: z.string(),
    })
    .optional(),
});

export type MercadoPagoWebhookInput = z.infer<typeof MercadoPagoWebhookSchema>;

// ─── Report Generation ────────────────────────────────────────────────────────

export const GenerateReportSchema = z.object({
  transactionId: z.string().uuid('ID de transacción inválido'),
});

export type GenerateReportInput = z.infer<typeof GenerateReportSchema>;

// ─── Environment Variable Validation ─────────────────────────────────────────
/**
 * Valida que todas las variables de entorno críticas estén presentes en el servidor.
 * Lanza un error en tiempo de build/arranque si falta alguna.
 * NUNCA exponer al cliente — solo llamar desde código server-side.
 */
export function validateServerEnv(): void {
  const required: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
    MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  };

  const missing = Object.entries(required)
    .filter(([, v]) => !v || v.trim() === '')
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `[Astral Evolution] Variables de entorno faltantes: ${missing.join(', ')}.\n` +
      'Agrega estas variables en el dashboard de Vercel antes de hacer deploy.'
    );
  }

  // Detectar saltos de línea invisibles (problema reportado con echo en Vercel)
  const hasLineBreaks = Object.entries(required).filter(
    ([, v]) => v && /[\r\n]/.test(v)
  );
  if (hasLineBreaks.length > 0) {
    throw new Error(
      `[Astral Evolution] Variables con saltos de línea detectados: ${hasLineBreaks.map(([k]) => k).join(', ')}.\n` +
      'Usa el dashboard web de Vercel para recargarlas (NO usar echo en CLI).'
    );
  }
}

// ─── Output Sanitizer (para reportes de IA) ──────────────────────────────────

/**
 * Sanitiza el texto generado por Gemini antes de renderizarlo en el DOM.
 * Elimina tags HTML, scripts y caracteres de control peligrosos.
 */
export function sanitizeAIOutput(raw: string): string {
  return raw
    // Eliminar tags HTML/script
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Eliminar inyecciones de protocolo
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    // Escapar entidades HTML básicas
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Eliminar caracteres de control (excepto saltos de línea y tabs)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}
