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

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu Reporte Astrológico</title>
  <style>
    body { font-family: Georgia, serif; background: #f5f0ff; color: #1a0a2e; margin: 0; padding: 0; }
    .container { max-width: 700px; margin: 0 auto; padding: 40px 20px; background: #f5f0ff; }
    .header { text-align: center; padding: 40px 0 30px; border-bottom: 2px solid #7c3aed; }
    .header h1 { font-size: 26px; color: #5b21b6; letter-spacing: 3px; margin: 0 0 8px; }
    .header p { color: #6d28d9; font-size: 14px; margin: 0; }
    .greeting { padding: 30px 0 20px; font-size: 16px; color: #1a0a2e; line-height: 1.6; }
    .report-content { background: #ffffff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 30px; margin: 20px 0; line-height: 1.9; color: #1a0a2e; font-size: 15px; }
    .report-content h1, .report-content h2, .report-content h3 { color: #5b21b6; }
    .footer { text-align: center; padding: 30px 0; color: #7c3aed; font-size: 12px; border-top: 1px solid #ddd6fe; margin-top: 30px; }
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
    <div class="report-content">${safeHTML}</div>
    <div class="footer">
      <p>© 2026 Astral Evolution · Todos los derechos reservados</p>
      <p>Este análisis es personal y confidencial.</p>
    </div>
  </div>
</body>
</html>`;

  await sgMail.send({
        to,
        from: {
                email: 'lecturas@astralevolution.com',
                name: 'Astral Evolution',
        },
        subject: `✦ Tu ${productName} está listo, ${userName}`,
        html,
  });

  console.log(`[Email] Reporte enviado a ${to} via SendGrid ✓`);
}
