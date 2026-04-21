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
  <title>Tu Reporte Astrológico · Astral Evolution</title>
  <style>
    body { margin: 0; padding: 0; background: #f0ebff; font-family: Georgia, 'Times New Roman', serif; }
    .wrapper { background: #f0ebff; padding: 40px 20px; }
    .container { max-width: 680px; margin: 0 auto; }

    /* Header */
    .header { background: linear-gradient(135deg, #1a0533 0%, #2d1058 50%, #1a0533 100%); border-radius: 16px 16px 0 0; padding: 48px 40px 40px; text-align: center; }
    .header-stars { font-size: 22px; letter-spacing: 8px; color: #c9a96e; margin-bottom: 16px; }
    .header h1 { margin: 0 0 8px; font-size: 28px; font-weight: normal; letter-spacing: 4px; color: #f0e6ff; }
    .header-sub { font-size: 13px; color: #9b7fd4; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
    .header-divider { width: 60px; height: 1px; background: #c9a96e; margin: 20px auto; }

    /* Greeting */
    .greeting { background: #ffffff; padding: 32px 40px; border-left: 4px solid #7c3aed; }
    .greeting p { margin: 0 0 12px; font-size: 16px; color: #2d1058; line-height: 1.7; }
    .greeting p:last-child { margin: 0; }
    .product-badge { display: inline-block; background: #f0ebff; color: #5b21b6; font-size: 12px; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; border: 1px solid #c4b5fd; margin-bottom: 12px; text-transform: uppercase; }

    /* Report content */
    .report-body { background: #ffffff; padding: 0 40px 40px; }
    .report-body h2 {
      font-size: 17px;
      font-weight: bold;
      color: #ffffff;
      background: linear-gradient(90deg, #5b21b6, #7c3aed);
      padding: 12px 20px;
      border-radius: 8px;
      margin: 36px 0 16px;
      letter-spacing: 0.5px;
    }
    .report-body p { font-size: 15px; color: #1e1033; line-height: 1.85; margin: 0 0 16px; }
    .report-body strong { color: #5b21b6; font-weight: bold; }
    .report-body ul { padding-left: 20px; margin: 0 0 16px; }
    .report-body li { font-size: 15px; color: #1e1033; line-height: 1.85; margin-bottom: 8px; }

    /* Footer */
    .footer { background: #1a0533; border-radius: 0 0 16px 16px; padding: 32px 40px; text-align: center; }
    .footer p { margin: 0 0 6px; font-size: 12px; color: #9b7fd4; letter-spacing: 0.5px; }
    .footer p:last-child { margin: 0; color: #5b3a8a; font-size: 11px; }
    .footer-stars { font-size: 16px; letter-spacing: 6px; color: #c9a96e; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <div class="header">
        <div class="header-stars">✦ ✦ ✦</div>
        <h1>ASTRAL EVOLUTION</h1>
        <p class="header-sub">Astrología Evolutiva Personalizada</p>
        <div class="header-divider"></div>
        <p style="margin:0;font-size:14px;color:#c4b5fd;">Tu análisis está listo, ${userName}</p>
      </div>

      <div class="greeting">
        <span class="product-badge">✦ ${productName}</span>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Lo que encontrarás a continuación ha sido preparado especialmente para vos, basado en la configuración única del cielo en el momento de tu nacimiento. Este es un análisis personal y confidencial.</p>
        <p>Tomá el tiempo que necesites para leerlo con calma.</p>
      </div>

      <div class="report-body">
        ${safeHTML}
      </div>

      <div class="footer">
        <div class="footer-stars">✦ ✦ ✦</div>
        <p>© 2026 Astral Evolution · Todos los derechos reservados</p>
        <p>Este análisis es personal y confidencial · lecturas@astralevolution.com</p>
      </div>

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
