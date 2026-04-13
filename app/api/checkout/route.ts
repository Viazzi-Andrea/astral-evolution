/**
 * /api/checkout — Mercado Pago (PRODUCCIÓN)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface MPPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

const PRODUCT_PRICES: Record<string, number> = {
  'lectura-esencial':   10.50,
  'consulta-evolutiva': 26.60,
  'especial-parejas':   38.50,
};

const PRODUCT_NAMES: Record<string, string> = {
  'lectura-esencial':   'Lectura Esencial — Astral Evolution',
  'consulta-evolutiva': 'Consulta Evolutiva — Astral Evolution',
  'especial-parejas':   'Especial Parejas — Astral Evolution',
};

// IDs reales de la tabla products en Supabase
const PRODUCT_IDS: Record<string, string> = {
  'lectura-esencial':   '5ae9b326-62fb-4833-b12c-acb0a34a37e3',
  'consulta-evolutiva': '585f34fd-a14e-45f1-9e76-cb5811c31373',
  'especial-parejas':   'f593bc9f-e3a5-4e13-b8ba-924ac92edc75',
};

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { productSlug, birthData, countryCode = 'UY' } = body;

    if (!productSlug || !birthData?.email || !birthData?.name) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos.' },
        { status: 400 }
      );
    }

    const accessToken = process.env.MP_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'El sistema de pagos no está configurado.' },
        { status: 500 }
      );
    }

    // ── 1. Guardar / recuperar usuario ────────────────────────────────────────
    let userId: string;

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', birthData.email.toLowerCase().trim())
      .maybeSingle();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email:        birthData.email.toLowerCase().trim(),
          name:         birthData.name.trim(),
          country_code: countryCode,
          language:     'es',
        })
        .select('id')
        .single();

      if (userError || !newUser) {
        console.error('❌ Error creando usuario:', userError);
        return NextResponse.json(
          { error: 'No se pudo registrar el usuario.', details: userError?.message },
          { status: 500 }
        );
      }
      userId = newUser.id;
    }

    console.log('👤 Usuario:', userId);

    // ── 2. Guardar datos de nacimiento ────────────────────────────────────────
    const { data: birthRecord, error: birthError } = await supabaseAdmin
      .from('birth_data')
      .insert({
        user_id:          userId,
        name:             birthData.name.trim(),
        birth_date:       birthData.birthDate,
        birth_time:       birthData.birthTime,
        birth_city:       birthData.birthCity,
        birth_country:    birthData.birthCountry,
        personal_context: birthData.personalContext ?? null,
      })
      .select('id')
      .single();

    if (birthError || !birthRecord) {
      console.error('❌ Error guardando birth_data:', birthError);
      return NextResponse.json(
        { error: 'No se pudieron guardar los datos de nacimiento.', details: birthError?.message },
        { status: 500 }
      );
    }

    console.log('🌟 Birth data:', birthRecord.id);

    // ── 3. Crear preferencia en Mercado Pago ──────────────────────────────────
    const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? 'https://astralevolution.com';
    const isSandbox    = accessToken.startsWith('TEST-');
    const isLocalhost  = appUrl.includes('localhost');
    const unitPrice    = PRODUCT_PRICES[productSlug] ?? 10.50;
    const productTitle = PRODUCT_NAMES[productSlug] ?? 'Lectura Astrológica — Astral Evolution';
    const productId    = PRODUCT_IDS[productSlug] ?? '';

    const preference: Record<string, unknown> = {
      items: [{
        id:          productId,
        title:       productTitle,
        description: `Reporte astrológico para ${birthData.name}`,
        category_id: 'services',
        quantity:    1,
        currency_id: 'UYU',
        unit_price:  unitPrice,
      }],
      payer: {
        name:  birthData.name,
        email: birthData.email.toLowerCase().trim(),
      },
      metadata: {
        product_slug:  productSlug,
        product_id:    productId,
        user_id:       userId,
        birth_data_id: birthRecord.id,
        country_code:  countryCode,
      },
      back_urls: {
        success: `${appUrl}/gracias?status=success&product=${productSlug}`,
        failure: `${appUrl}/productos/${productSlug}?status=failure`,
        pending: `${appUrl}/gracias?status=pending&product=${productSlug}`,
      },
      notification_url:     `${appUrl}/api/webhooks/mercadopago`,
      statement_descriptor: 'ASTRAL EVOLUTION',
      expires:              false,
    };

    if (!isSandbox && !isLocalhost) {
      preference.auto_return = 'approved';
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.json().catch(() => ({}));
      console.error('❌ Error MP:', mpResponse.status, JSON.stringify(errorBody));
      return NextResponse.json(
        { error: 'No se pudo crear el pago.', details: errorBody?.message },
        { status: 500 }
      );
    }

    const mpData: MPPreferenceResponse = await mpResponse.json();
    const checkoutUrl = isSandbox ? mpData.sandbox_init_point : mpData.init_point;

    console.log('💳 Preferencia MP creada:', mpData.id);

    // ── 4. Crear transacción en Supabase ──────────────────────────────────────
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id:          userId,
        product_id:       productId,
        birth_data_id:    birthRecord.id,
        mp_preference_id: mpData.id,
        amount:           unitPrice,
        currency:         'UYU',
        country_code:     countryCode,
        status:           'pending',
      })
      .select('id')
      .single();

    if (txError) {
      console.error('❌ Error creando transacción:', txError.message);
    } else {
      console.log('✅ Transacción creada:', transaction?.id);
    }

    return NextResponse.json({ success: true, checkoutUrl, preferenceId: mpData.id });

  } catch (error) {
    console.error('❌ Error interno:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
