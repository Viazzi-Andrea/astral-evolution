/**
 * app/api/checkout/route.ts
 * Checkout con Mercado Pago — reemplaza completamente Paddle.
 * Crea usuario, birth_data y transacción en Supabase, luego genera la URL de pago de MP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CheckoutRequestSchema, validateServerEnv } from '@/lib/validations/schemas';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// ─── Precios reales por producto ──────────────────────────────────────────────
const PRODUCT_PRICES: Record<string, { amount: number; title: string }> = {
  'lectura-esencial': { amount: 10.5, title: 'Lectura Esencial — Astral Evolution' },
  'consulta-evolutiva': { amount: 26.6, title: 'Consulta Evolutiva — Astral Evolution' },
  'especial-parejas': { amount: 38.5, title: 'Especial Parejas — Astral Evolution' },
};

// ─── IDs de productos en Supabase (hardcoded como fallback seguro) ────────────
const PRODUCT_IDS: Record<string, string> = {
  'lectura-esencial': '5ae9b326-62fb-4833-b12c-acb0a34a37e3',
  'consulta-evolutiva': '585f34fd-a14e-45f1-9e76-cb5811c31373',
  'especial-parejas': 'f593bc9f-e3a5-4e13-b8ba-924ac92edc75',
};

export async function POST(request: NextRequest) {
  // ─── 1. Validar entorno ───────────────────────────────────────────────────
  try {
    // validateServerEnv(); // desactivado temporalmente
  } catch (envError) {
    console.error('[Checkout] Error de configuración:', envError);
    return NextResponse.json(
      { error: 'Error de configuración del servidor. Contacta al administrador.' },
      { status: 500 }
    );
  }

  // ─── 2. Parsear y validar input con Zod ──────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido en el cuerpo de la petición.' }, { status: 400 });
  }

  const parsed = CheckoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return NextResponse.json(
      { error: firstError.message, field: firstError.path.join('.') },
      { status: 422 }
    );
  }

  const { productSlug, birthData, partnerBirthData, countryCode, discountCode } = parsed.data;

  // ─── 3. Verificar que el producto requiere partner data si aplica ──────────
  if (productSlug === 'especial-parejas' && !partnerBirthData) {
    return NextResponse.json(
      { error: 'Se requieren los datos de nacimiento de la pareja para este producto.' },
      { status: 422 }
    );
  }

  const productPrice = PRODUCT_PRICES[productSlug];
  if (!productPrice) {
    return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
  }

  // ─── 4. Inicializar clientes ─────────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const mp = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  });
  const preference = new Preference(mp);

  try {
    // ─── 5. Upsert de usuario ─────────────────────────────────────────────
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert(
        {
          email: birthData.email,
          name: birthData.name,
          language: birthData.language ?? 'es',
          country_code: countryCode,
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single();

    if (userError || !user) {
      console.error('[Checkout] Error upsert usuario:', userError);
      return NextResponse.json(
        { error: 'Error al registrar el usuario. Intenta nuevamente.' },
        { status: 500 }
      );
    }

    // ─── 6. Insertar birth_data principal ────────────────────────────────
    const { data: birthRecord, error: birthError } = await supabase
      .from('birth_data')
      .insert({
        user_id: user.id,
        name: birthData.name,
        birth_date: birthData.birthDate,
        birth_time: birthData.birthTime,
        birth_city: birthData.birthCity,
        birth_country: birthData.birthCountry,
        personal_context: birthData.personalContext ?? null,
      })
      .select('id')
      .single();

    if (birthError || !birthRecord) {
      console.error('[Checkout] Error insertar birth_data:', birthError);
      return NextResponse.json(
        { error: 'Error al guardar los datos de nacimiento.' },
        { status: 500 }
      );
    }

    // ─── 7. Insertar birth_data de la pareja (si aplica) ─────────────────
    let partnerBirthId: string | null = null;
    if (partnerBirthData) {
      const { data: partnerRecord, error: partnerError } = await supabase
        .from('birth_data')
        .insert({
          user_id: user.id,
          name: partnerBirthData.name,
          birth_date: partnerBirthData.birthDate,
          birth_time: partnerBirthData.birthTime,
          birth_city: partnerBirthData.birthCity,
          birth_country: partnerBirthData.birthCountry,
          personal_context: partnerBirthData.personalContext ?? null,
        })
        .select('id')
        .single();

      if (partnerError) {
        console.error('[Checkout] Error insertar partner birth_data:', partnerError);
        // No fatal — continuar sin partner
      } else {
        partnerBirthId = partnerRecord?.id ?? null;
      }
    }

    // ─── 8. Crear transacción pendiente en Supabase ───────────────────────
    const DISCOUNT_CODES: Record<string,number> = { PRUEBA100: 100, ASTRAL50: 50, CUMPLE: 20 };
    const discountPct = discountCode ? (DISCOUNT_CODES[String(discountCode).toUpperCase()] || 0) : 0;
    const finalAmount = discountPct === 100 ? 0.01 : Math.round(productPrice.amount * (1 - discountPct / 100) * 100) / 100;
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        product_id: PRODUCT_IDS[productSlug],
        birth_data_id: birthRecord.id,
        partner_birth_data_id: partnerBirthId,
        amount: Math.round(finalAmount * 100) / 100,
        currency: 'USD',
        country_code: countryCode,
        status: 'pending',
      })
      .select('id')
      .single();

    if (txError || !transaction) {
      console.error('[Checkout] Error crear transacción:', txError);
      return NextResponse.json(
        { error: 'Error al inicializar el pago. Intenta nuevamente.' },
        { status: 500 }
      );
    }

    // ─── 9. Crear preferencia de Mercado Pago ────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://astralevolution.com';

    const mpPreference = await preference.create({
      body: {
        items: [
          {
            id: productSlug,
            title: productPrice.title,
            quantity: 1,
            unit_price: Math.round(finalAmount * 100) / 100,
            currency_id: 'USD',
          },
        ],
        payer: {
          name: birthData.name,
          email: birthData.email,
        },
        external_reference: transaction.id,
        back_urls: {
          success: `${appUrl}/gracias?transactionId=${transaction.id}&status=approved`,
          failure: `${appUrl}/pago-fallido?transactionId=${transaction.id}`,
          pending: `${appUrl}/gracias?transactionId=${transaction.id}&status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        statement_descriptor: 'ASTRAL EVOLUTION',
        expires: true,
        expiration_date_to: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas
      },
    });

    if (!mpPreference.init_point) {
      console.error('[Checkout] MP no retornó init_point:', mpPreference);
      return NextResponse.json(
        { error: 'Error al crear el enlace de pago. Intenta nuevamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl: mpPreference.init_point,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('[Checkout] Error inesperado:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
