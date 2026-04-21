/**
 * lib/email/send-report.ts
 * Envío de reportes astrológicos via SendGrid.
 * Diseño: dark mode, tarjetas por sección — mismo estilo que la web.
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

// ─── Convierte el HTML del reporte en tarjetas por sección ───────────────────
function wrapInCards(html: string): string {
  // Separar en secciones por cada <h2>
  const parts = html.split(/(?=<h2[^>]*>)/i);

  return parts.map(part => {
    const trimmed = part.trim();
    if (!trimmed) return '';

    // Secciones con encabezado h2
    if (/^<h2/i.test(trimmed)) {
      const match = trimmed.match(/^<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*)$/i);
      if (match) {
        const [, title, body] = match;
        return `
<div style="margin-bottom:24px; border-radius:14px; overflow:hidden; border:1px solid rgba(196,181,253,0.15);">
  <div style="background:linear-gradient(135deg,#2d1058 0%,#4c1d95 60%,#2d1058 100%); padding:18px 28px; border-bottom:1px solid #c9a96e40;">
    <p style="margin:0; font-size:13px; font-weight:bold; color:#f0e6ff; letter-spacing:2px; text-transform:uppercase; font-family:Georgia,'Times New Roman',serif;">${title}</p>
  </div>
  <div style="background:#160b2e; padding:28px 28px 24px;">
    ${styleBody(body)}
  </div>
</div>`;
      }
    }

    // Contenido intro antes del primer h2 (h1, subtítulo, etc.)
    if (/^<h1/i.test(trimmed)) {
      const match = trimmed.match(/^<h1[^>]*>([\s\S]*?)<\/h1>([\s\S]*)$/i);
      if (match) {
        const [, title, rest] = match;
        return `
<div style="text-align:center; padding:32px 24px 24px;">
  <p style="margin:0 0 8px; font-size:22px; font-weight:normal; color:#f0e6ff; letter-spacing:3px; font-family:Georgia,'Times New Roman',serif;">${title}</p>
  <div style="width:60px; height:1px; background:#c9a96e; margin:16px auto;"></div>
  ${rest ? `<p style="margin:0; font-size:13px; color:#9b7fd4; letter-spacing:1px; font-family:Georgia,'Times New Roman',serif;">${rest.replace(/<[^>]+>/g, '').trim()}</p>` : ''}
</div>`;
      }
    }

    // Cualquier otro contenido suelto
    return `<div style="padding:0 4px 16px;">${styleBody(trimmed)}</div>`;
  }).filter(Boolean).join('\n');
}

// ─── Aplica estilos inline al cuerpo de cada sección ─────────────────────────
function styleBody(html: string): string {
  return html
    .replace(
      /<p>/g,
      '<p style="margin:0 0 18px; font-size:15px; color:#d4c5f5; line-height:1.9; font-family:Georgia,\'Times New Roman\',serif;">'
    )
    .replace(/<\/p>/g, '</p>')
    .replace(
      /<strong>/g,
      '<strong style="color:#c9a96e; font-weight:bold;">'
    )
    .replace(
      /<em>/g,
      '<em style="color:#b8a4e8; font-style:italic;">'
    )
    .replace(
      /<ul>/g,
      '<ul style="padding-left:0; margin:0 0 18px; list-style:none;">'
    )
    .replace(
      /<li>/g,
      '<li style="font-size:15px; color:#d4c5f5; line-height:1.85; margin-bottom:10px; padding-left:20px; position:relative; font-family:Georgia,\'Times New Roman\',serif; background:url(\'data:image/svg+xml,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'8\\\' height=\\\'8\\\' viewBox=\\\'0 0 8 8\\\'><circle cx=\\\'4\\\' cy=\\\'4\\\' r=\\\'3\\\' fill=\\\'%23c9a96e\\\'/></svg>\') no-repeat 0 7px;">'
    )
    .replace(
      /<h3>/g,
      '<h3 style="font-size:13px; font-weight:bold; color:#9b7fd4; margin:24px 0 10px; letter-spacing:1.5px; text-transform:uppercase; font-family:Georgia,\'Times New Roman\',serif;">'
    )
    .replace(/<hr>/g, '<div style="border-top:1px solid rgba(196,181,253,0.15); margin:20px 0;"></div>');
}

// ─── Email completo ───────────────────────────────────────────────────────────
export async function sendReportEmail({
  to,
  userName,
  productName,
  reportHTML,
}: {
  to:          string;
  userName:    string;
  productName: string;
  reportHTML:  string;
}): Promise<void> {
  const safeHTML = sanitizeHTML(reportHTML);
  const cards    = wrapInCards(safeHTML);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu Reporte Astrológico · Astral Evolution</title>
</head>
<body style="margin:0; padding:0; background:#0a0618; font-family:Georgia,'Times New Roman',serif;">

  <div style="background:#0a0618; padding:40px 16px;">
    <div style="max-width:660px; margin:0 auto;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1a0533 0%,#2d1058 50%,#1a0533 100%); border-radius:16px 16px 0 0; padding:48px 40px 40px; text-align:center; border-bottom:1px solid #c9a96e40;">
        <p style="margin:0 0 16px; font-size:20px; letter-spacing:10px; color:#c9a96e;">✦ ✦ ✦</p>
        <h1 style="margin:0 0 8px; font-size:26px; font-weight:normal; letter-spacing:5px; color:#f0e6ff; font-family:Georgia,'Times New Roman',serif;">ASTRAL EVOLUTION</h1>
        <p style="margin:0; font-size:11px; color:#9b7fd4; letter-spacing:3px; text-transform:uppercase;">Astrología Evolutiva Personalizada</p>
        <div style="width:60px; height:1px; background:#c9a96e; margin:24px auto;"></div>
        <p style="margin:0; font-size:14px; color:#c4b5fd; font-family:Georgia,'Times New Roman',serif;">Tu análisis está listo, <strong style="color:#f0e6ff;">${userName}</strong></p>
      </div>

      <!-- Saludo -->
      <div style="background:#160b2e; padding:32px 40px; border-left:3px solid #7c3aed; border-right:1px solid rgba(196,181,253,0.1);">
        <p style="margin:0 0 6px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#7c3aed;">✦ ${productName}</p>
        <p style="margin:12px 0 10px; font-size:16px; color:#e2d9f3; line-height:1.7; font-family:Georgia,'Times New Roman',serif;">
          Hola <strong style="color:#f0e6ff;">${userName}</strong>,
        </p>
        <p style="margin:0 0 10px; font-size:15px; color:#b8a4e8; line-height:1.8; font-family:Georgia,'Times New Roman',serif;">
          Lo que encontrarás a continuación ha sido preparado especialmente para vos, basado en la configuración única del cielo en el momento de tu nacimiento.
        </p>
        <p style="margin:0; font-size:15px; color:#b8a4e8; line-height:1.8; font-family:Georgia,'Times New Roman',serif;">
          Tomá el tiempo que necesites para leerlo con calma.
        </p>
      </div>

      <!-- Separador -->
      <div style="background:#120826; padding:16px 40px; border-left:1px solid rgba(196,181,253,0.1); border-right:1px solid rgba(196,181,253,0.1);">
        <div style="border-top:1px solid rgba(196,181,253,0.1);"></div>
      </div>

      <!-- Cuerpo del reporte: tarjetas por sección -->
      <div style="background:#120826; padding:8px 24px 32px; border-left:1px solid rgba(196,181,253,0.1); border-right:1px solid rgba(196,181,253,0.1);">
        ${cards}
      </div>

      <!-- Footer -->
      <div style="background:linear-gradient(135deg,#1a0533 0%,#0f0720 100%); border-radius:0 0 16px 16px; padding:32px 40px; text-align:center; border-top:1px solid #c9a96e30;">
        <p style="margin:0 0 16px; font-size:14px; letter-spacing:8px; color:#c9a96e;">✦ ✦ ✦</p>
        <p style="margin:0 0 6px; font-size:12px; color:#9b7fd4; letter-spacing:0.5px;">© 2026 Astral Evolution · Todos los derechos reservados</p>
        <p style="margin:0; font-size:11px; color:#5b3a8a;">Este análisis es personal y confidencial · lecturas@astralevolution.com</p>
      </div>

    </div>
  </div>

</body>
</html>`;

  await sgMail.send({
    to,
    from: {
      email: 'lecturas@astralevolution.com',
      name:  'Astral Evolution',
    },
    subject: `✦ Tu ${productName} está listo, ${userName}`,
    html,
  });

  console.log(`[Email] Reporte enviado a ${to} via SendGrid ✓`);
}
