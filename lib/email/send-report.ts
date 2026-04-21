/**
 * lib/email/send-report.ts
 * Envío de reportes astrológicos via SendGrid (migrado desde Resend)
 */

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// ─── Sanitizar HTML para evitar XSS ──────────────────────────────────────────
export function sanitizeHTML(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
}

// ─── Email de reporte completo ────────────────────────────────────────────────
export async function sendReportEmail({
    to,
    userName,
    productName,
    reportHTML,
}: {
    to: string;
    userName: string;
    productName: string;
    reportHTML: string;
}): Promise<void> {
    const safeHTML = sanitizeHTML(reportHTML);

  const html = `
      <!DOCTYPE html>
          <html lang="es">
              <head>
                    <meta charset="UTF-8" />
                          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                                <title>Tu Reporte Astrológico</title>
                                      <style>
                                              body { font-family: Georgia, serif; background: #0a0a1a; color: #e8e0f0; margin: 0; padding: 0; }
                                                      .container { max-width: 700px; margin: 0 auto; padding: 40px 20px; }
                                                              .header { text-align: center; padding: 40px 0 30px; border-bottom: 1px solid #2a1f4a; }
                                                                      .header h1 { font-size: 28px; color: #c9a6f5; letter-spacing: 3px; margin: 0 0 8px; }
                                                                              .header p { color: #9b8ab0; font-size: 14px; margin: 0; }
                                                                                      .greeting { padding: 30px 0 20px; font-size: 16px; color: #c9b8e0; line-height: 1.6; }
                                                                                              .report-content { background: #100d1f; border: 1px solid #2a1f4a; border-radius: 12px; padding: 30px; margin: 20px 0; line-height: 1.8; }
                                                                                                      .footer { text-align: center; padding: 30px 0; color: #6b5f80; font-size: 12px; border-top: 1px solid #2a1f4a; margin-top: 30px; }
                                                                                                            </style>
                                                                                                                </head>
                                                                                                                    <body>
                                                                                                                          <div class="container">
                                                                                                                                  <div class="header">
                                                                                                                                            <h1>✦ ASTRAL EVOLUTION ✦</h1>
                                                                                                                                                      <p>Tu análisis astrológico personalizado</p>
                                                                                                                                                              </div>
                                                                                                                                                                      <div class="greeting">
                                                                                                                                                                                <p>Hola <strong>${userName}</strong>,</p>
                                                                                                                                                                                          <p>Tu <strong>${productName}</strong> está listo. Lo que encontrarás a continuación ha sido preparado especialmente para vos, basado en la configuración única del cielo en el momento de tu nacimiento.</p>
                                                                                                                                                                                                  </div>
                                                                                                                                                                                                          <div class="report-content">
                                                                                                                                                                                                                    ${safeHTML}
                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                    <div class="footer">
                                                                                                                                                                                                                                              <p>© 2026 Astral Evolution · Todos los derechos reservados</p>
                                                                                                                                                                                                                                                        <p>Este análisis es personal y confidencial.</p>
                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                          </body>
                                                                                                                                                                                                                                                                              </html>
                                                                                                                                                                                                                                                                                `;

  await sgMail.send({
        to,
        from: {
                email: 'castraluy@gmail.com',
                name: 'Astral Evolution',
        },
        subject: `✦ Tu ${productName} está listo, ${userName}`,
        html,
  });

  console.log(`[Email] Reporte enviado a ${to} via SendGrid ✓`);
}
