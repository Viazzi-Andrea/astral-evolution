import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthData } = body;

    if (!birthData) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    console.log('\n=== TEST GEMINI SIMPLE ===');
    console.log('Datos recibidos:', birthData);

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY no configurada' },
        { status: 500 }
      );
    }

    console.log('API Key detectada:', apiKey.substring(0, 8) + '...');

    const prompt = `Eres un astrólogo profesional. Genera una lectura astrológica breve para:
Nombre: ${birthData.name}
Fecha de nacimiento: ${birthData.birthDate}
Hora: ${birthData.birthTime}
Lugar: ${birthData.birthCity}, ${birthData.birthCountry}

Genera un párrafo corto de interpretación astrológica.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    console.log('URL (redacted):', url.replace(apiKey, 'REDACTED'));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error de Gemini:', JSON.stringify(errorData, null, 2));
      return NextResponse.json(
        {
          error: 'Error de Gemini',
          details: errorData,
          status: response.status
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('Response data keys:', Object.keys(data));

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Formato de respuesta invalido:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: 'Formato de respuesta invalido', data },
        { status: 500 }
      );
    }

    const reportText = data.candidates[0].content.parts[0].text;
    console.log('REPORTE GENERADO:', reportText);

    return NextResponse.json({
      success: true,
      report: reportText,
      message: 'Gemini respondio correctamente',
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      {
        error: 'Error interno',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
