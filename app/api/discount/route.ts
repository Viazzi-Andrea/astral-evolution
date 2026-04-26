import { NextRequest, NextResponse } from 'next/server';

function getDiscountCodes(): Record<string, number> {
  const raw = process.env.DISCOUNT_CODES?.trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('[Discount] DISCOUNT_CODES no es JSON válido');
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Código inválido' });
    }
    const codes = getDiscountCodes();
    const discount = codes[code.trim().toUpperCase()];
    if (!discount) return NextResponse.json({ valid: false, error: 'Código inválido' });
    return NextResponse.json({ valid: true, discountPercent: discount });
  } catch {
    return NextResponse.json({ valid: false, error: 'Error' });
  }
}