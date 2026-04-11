import { BirthData, Product } from '@/lib/types/database';
import { getPromptForProduct } from './prompts';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function generateAstrologicalReport(
  product: Product,
  birthData: BirthData,
  partnerData?: BirthData
): Promise<string> {
  const prompt = getPromptForProduct(product.prompt_template, birthData, partnerData);

  if (process.env.GEMINI_API_KEY) {
    return await generateWithGemini(prompt);
  } else if (process.env.ANTHROPIC_API_KEY) {
    return await generateWithClaude(prompt);
  } else {
    throw new Error('No AI API key configured');
  }
}

export async function generateReport(
  reportId: string,
  product: Product,
  birthData: BirthData,
  partnerData?: BirthData | null
): Promise<void> {
  try {
    // Update report status to generating
    await supabaseAdmin
      .from('reports')
      .update({ status: 'generating' })
      .eq('id', reportId);

    // Generate the report content
    const reportContent = await generateAstrologicalReport(
      product,
      birthData,
      partnerData || undefined
    );

    // Update report with the generated content
    await supabaseAdmin
      .from('reports')
      .update({
        status: 'completed',
        ai_response: reportContent,
        generated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    console.log(`Report ${reportId} generated successfully`);
  } catch (error) {
    console.error(`Error generating report ${reportId}:`, error);

    // Update report status to failed
    await supabaseAdmin
      .from('reports')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', reportId);

    throw error;
  }
}

async function generateWithGemini(prompt: string): Promise<string> {
  const rawApiKey = process.env.GEMINI_API_KEY;

  if (!rawApiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const apiKey = rawApiKey.trim();

  console.log('[GEMINI DEBUG] Using API Key starting with:', apiKey.substring(0, 8) + '...');
  console.log('[GEMINI DEBUG] Prompt length:', prompt.length);
  console.log('[GEMINI DEBUG] Prompt preview:', prompt.substring(0, 100) + '...');

  const testPrompt = 'Hola, soy un test astral para Andrea. Responde con una frase corta.';

  console.log('[GEMINI DEBUG] Using simplified test prompt:', testPrompt);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    console.log('[GEMINI DEBUG] API URL (redacted):', url.replace(apiKey, 'REDACTED'));

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: testPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    };

    console.log('[GEMINI DEBUG] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[GEMINI DEBUG] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GEMINI FULL ERROR]:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }

      const errorMessage = errorData?.error?.message || response.statusText;
      console.error('[GEMINI ERROR] Parsed error:', JSON.stringify(errorData, null, 2));
      throw new Error(`Gemini API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    console.log('[GEMINI DEBUG] Response data keys:', Object.keys(data));
    console.log('[GEMINI DEBUG] Full response:', JSON.stringify(data, null, 2));

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('[GEMINI ERROR] Invalid response format:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response format from Gemini API');
    }

    const resultText = data.candidates[0].content.parts[0].text;
    console.log('[GEMINI SUCCESS] Generated text:', resultText);

    return resultText;
  } catch (error) {
    console.error('[GEMINI ERROR] Exception caught:', error);
    if (error instanceof Error) {
      console.error('[GEMINI ERROR] Error message:', error.message);
      console.error('[GEMINI ERROR] Error stack:', error.stack);
    }
    throw error;
  }
}

async function generateWithClaude(prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}
