import { NextRequest, NextResponse } from 'next/server';

const CODES: Record<string, number> = {
  PRUEBA100: 100,
  ASTRAL50: 50,
  CUMPLE: 20,
};

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const discount = CODES[String(code).toUpperCase()];
    if (!discount) return NextResponse.json({ valid: false, error: 'Codigo invalido' });
    return NextResponse.json({ valid: true, discountPercent: discount });
  } catch {
    return NextResponse.json({ valid: false, error: 'Error' });
  }
}