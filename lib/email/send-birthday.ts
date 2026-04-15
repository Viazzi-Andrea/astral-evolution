/**
 * lib/email/send-birthday.ts
 * Email de cumpleaños con mini análisis de Revolución Solar.
 * Se envía automáticamente el día del cumpleaños de cada cliente.
 * Incluye 2-3 revelaciones del año + CTA para comprar el análisis completo.
 */

export interface BirthdayEmailData {
  toEmail: string;
  toName: string;
  birthDate: string;       // "YYYY-MM-DD"
  birthCity: string;
  birthCountry: string;
  miniAnalysis: string;    // Generado por Gemini, ya sanitizado
  userId: string;
}

export function buildBirthdayEmailHTML(data: BirthdayEmailData): string {
  const year = new Date().getFullYear();

  // Formato: "15 de abril"
  const [, , day] = data.birthDate.split('-');
  const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const birthMonth = new Date(data.birthDate).getMonth();
  const birthdayFormatted = `${parseInt(day)} de ${monthNames[birthMonth]}`;

  // Mini análisis: convertir **negrita** a HTML
  const analysisHTML = data.miniAnalysis
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fbbf24;">$1</strong>')
    .split('\n\n')
    .map(p => `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:15px;color:#e5e7eb;line-height:1.8;">${p.trim()}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Feliz Cumpleaños, ${data.toName}! · Astral Evolution</title>
</head>
<body style="margin:0;padding:0;background-color:#06060f;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#06060f;min-height:100vh;">
  <tr>
    <td align="center" style="padding:40px 16px 60px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px;">

        <!-- ─── HEADER DE CUMPLEAÑOS ──────────────────────── -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:linear-gradient(160deg,#12080a 0%,#0f0a1e 60%,#120810 100%);border-radius:24px 24px 0 0;border:1px solid rgba(251,191,36,0.2);border-bottom:none;">
              <tr>
                <td style="padding:48px 40px 36px;text-align:center;">

                  <div style="margin-bottom:24px;">
                    <span style="display:inline-block;padding:8px 20px;border-radius:50px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);color:#fcd34d;font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;">
                      ✦ Astral Evolution ✦
                    </span>
                  </div>

                  <!-- Emoji animado cumpleaños -->
                  <div style="font-size:52px;margin-bottom:20px;line-height:1;">🎂</div>

                  <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:30px;font-weight:normal;color:#f9fafb;">
                    ¡Feliz Cumpleaños,<br>
                    <em style="color:#fcd34d;">${data.toName}</em>!
                  </h1>
                  <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:15px;color:#9ca3af;">
                    Hoy, ${birthdayFormatted}, el Sol vuelve exactamente al lugar donde estaba cuando llegaste al mundo.
                    <br>Eso se llama <strong style="color:#fbbf24;">Revolución Solar</strong> — y este año tiene mensajes únicos para vos.
                  </p>

                  <div style="margin:28px auto 0;max-width:200px;height:1px;background:linear-gradient(90deg,transparent,rgba(251,191,36,0.4),transparent);"></div>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ─── SECCIÓN: LO QUE VIENE ESTE AÑO ──────────── -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#0d0b1a;border-left:1px solid rgba(251,191,36,0.15);border-right:1px solid rgba(251,191,36,0.15);">
              <tr>
                <td style="padding:32px 40px;">

                  <!-- Título de sección -->
                  <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
                    <tr>
                      <td>
                        <div style="display:inline-block;padding:6px 14px;border-radius:8px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.25);">
                          <span style="font-family:Arial,sans-serif;font-size:12px;color:#fcd34d;letter-spacing:1px;text-transform:uppercase;font-weight:600;">
                            🔮 Tu año ${year} — ${year + 1}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Mini análisis -->
                  ${analysisHTML}

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ─── CTA: VER EL ANÁLISIS COMPLETO ────────────── -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#0d0b1a;border-left:1px solid rgba(251,191,36,0.15);border-right:1px solid rgba(251,191,36,0.15);">
              <tr>
                <td style="padding:0 40px 40px;">

                  <!-- Card de upgrade -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                    style="background:linear-gradient(135deg,rgba(251,191,36,0.08),rgba(139,92,246,0.08));border:1px solid rgba(251,191,36,0.25);border-radius:16px;">
                    <tr>
                      <td style="padding:28px 28px 24px;text-align:center;">
                        <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:18px;color:#f9fafb;">
                          Esto es solo el comienzo 🌟
                        </p>
                        <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:14px;color:#9ca3af;line-height:1.6;">
                          Tu Revolución Solar completa incluye el análisis de todas las casas activadas, los tránsitos del año, tus ciclos personales y un plan mes a mes. 10-15 páginas dedicadas únicamente a vos.
                        </p>
                        <a href="https://astralevolution.com/productos/consulta-evolutiva"
                          style="display:inline-block;padding:14px 32px;border-radius:50px;background:linear-gradient(135deg,#d97706,#b45309);color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">
                          🎁 Ver mi análisis completo →
                        </a>
                        <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#6b7280;">
                          Como cliente anterior, tenés acceso prioritario. Sin filas.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ─── FOOTER ─────────────────────────────────────── -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#090714;border-radius:0 0 24px 24px;border:1px solid rgba(251,191,36,0.1);border-top:none;">
              <tr>
                <td style="padding:24px 40px;text-align:center;">
                  <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#4b5563;">
                    Este regalo astral llega porque alguna vez confiaste en nosotros. Gracias 🙏
                  </p>
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#374151;">
                    © ${year} Astral Evolution ·
                    <a href="https://astralevolution.com" style="color:#6b21a8;text-decoration:none;">astralevolution.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

// ─── Envío del email de cumpleaños ────────────────────────────────────────────
export async function sendBirthdayEmail(data: BirthdayEmailData): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY no configurada' };

  const fromAddress = process.env.EMAIL_FROM?.trim() ?? 'lecturas@astralevolution.com';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Astral Evolution <${fromAddress}>`,
        to: [data.toEmail],
        subject: `🎂 ¡Feliz cumpleaños, ${data.toName}! Tu año astrológico te espera`,
        html: buildBirthdayEmailHTML(data),
        tags: [
          { name: 'category', value: 'birthday' },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    console.log(`[Birthday Email] Enviado a ${data.toEmail}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}
