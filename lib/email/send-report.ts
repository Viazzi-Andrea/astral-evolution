/**
 * lib/email/send-report.ts
 * Envío de reportes astrológicos via SendGrid.
 */

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export function sanitizeHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// ─── Divide el HTML en secciones y construye tarjetas ────────────────────────
function buildCards(html: string): string {
  // Dividir en bloques por cada h2
  const sections = html.split(/(<h2[^>]*>[\s\S]*?<\/h2>)/i).filter(s => s.trim());

  const cards: string[] = [];
  let i = 0;

  // Contenido antes del primer h2 (título h1, intro)
  if (sections.length > 0 && !sections[0].startsWith('<h2')) {
    const intro = sections[0]
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) =>
        `<p style="margin:0 0 8px;font-size:20px;color:#2d1058;letter-spacing:2px;font-family:Georgia,serif;font-weight:normal;">${t}</p>`
      )
      .replace(/<p>/g, '<p style="margin:8px 0 0;font-size:14px;color:#6b46b0;font-family:Georgia,serif;">');
    cards.push(`<div style="text-align:center;padding:24px 8px 32px;">${intro}</div>`);
    i = 1;
  }

  // Cada h2 + su contenido siguiente
  while (i < sections.length) {
    const heading = sections[i];
    const body    = sections[i + 1] ?? '';
    i += 2;

    if (!heading.startsWith('<h2')) continue;

    const titleText = heading.replace(/<[^>]+>/g, '').trim();
    const styledBody = body
      .replace(/<p>/g,        '<p style="margin:0 0 18px;font-size:15px;color:#1e1033;line-height:1.9;font-family:Georgia,serif;">')
      .replace(/<strong>/g,   '<strong style="color:#5b21b6;font-weight:bold;">')
      .replace(/<em>/g,       '<em style="color:#7c3aed;font-style:italic;">')
      .replace(/<ul>/g,       '<ul style="margin:0 0 18px;padding-left:20px;">')
      .replace(/<li>/g,       '<li style="font-size:15px;color:#1e1033;line-height:1.85;margin-bottom:8px;font-family:Georgia,serif;">')
      .replace(/<h3[^>]*>/g,  '<h3 style="font-size:13px;font-weight:bold;color:#5b21b6;margin:20px 0 8px;letter-spacing:1px;text-transform:uppercase;font-family:Georgia,serif;">')
      .replace(/<hr>/g,       '<div style="border-top:1px solid #e8deff;margin:16px 0;"></div>');

    cards.push(`
<div style="margin-bottom:20px;border-radius:12px;overflow:hidden;border:1px solid #ddd6fe;">
  <div style="background:linear-gradient(135deg,#1a0533 0%,#4c1d95 100%);padding:16px 24px;">
    <p style="margin:0;font-size:12px;font-weight:bold;color:#f0e6ff;letter-spacing:2px;text-transform:uppercase;font-family:Georgia,serif;">${titleText}</p>
  </div>
  <div style="background:#ffffff;padding:28px 28px 10px;border-top:2px solid #c9a96e;">
    ${styledBody}
  </div>
</div>`);
  }

  // Separador ornamental entre tarjetas
  const DIVIDER = `
<div style="text-align:center;padding:4px 0 8px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td style="width:40%;border-bottom:1px solid #ddd6fe;vertical-align:middle;"></td>
      <td style="padding:0 14px;white-space:nowrap;font-size:13px;color:#c9a96e;font-family:Georgia,serif;vertical-align:middle;">✦</td>
      <td style="width:40%;border-bottom:1px solid #ddd6fe;vertical-align:middle;"></td>
    </tr>
  </table>
</div>`;

  return cards.join(DIVIDER);
}

// ─── Email completo ───────────────────────────────────────────────────────────
type UpsellCard = { title: string; desc: string; url: string; cta: string };

const UPSELL_CARDS: Record<string, UpsellCard> = {
  evolutiva: {
    title: '¿Querés ir mucho más en profundidad?',
    desc: 'La <strong style="color:#f0e6ff;">Consulta Evolutiva</strong> analiza cada planeta en detalle — cómo pensás, cómo amás, tu misión de vida, tus patrones más profundos y orientación concreta para tu momento actual.',
    url: 'https://astralevolution.com/productos/consulta-evolutiva',
    cta: 'Descubrí la Consulta Evolutiva →',
  },
  parejas: {
    title: '¿Tenés pareja o alguien especial?',
    desc: 'El <strong style="color:#f0e6ff;">Especial Parejas</strong> analiza la sinastría entre dos cartas: qué los une, qué los tensiona, qué vienen a aprender juntos y cómo potenciar el vínculo.',
    url: 'https://astralevolution.com/productos/especial-parejas',
    cta: 'Descubrí el Especial Parejas →',
  },
  laboral: {
    title: 'Tu misión profesional, en profundidad',
    desc: 'Tu carta tiene mucho más para decirte sobre tu vocación, tus talentos únicos y el camino profesional que mejor se alinea con quién sos. El <strong style="color:#f0e6ff;">Análisis Laboral y Misión de Vida</strong> lo revela todo.',
    url: 'https://astralevolution.com',
    cta: 'Conocé el Análisis Laboral →',
  },
};

function upsellCard(card: UpsellCard): string {
  return `
  <div style="background:#2d1058;border-radius:10px;padding:24px 28px;text-align:center;flex:1;min-width:220px;">
    <p style="margin:0 0 8px;font-size:13px;color:#f0e6ff;font-family:Georgia,serif;font-weight:bold;">${card.title}</p>
    <p style="margin:0 0 16px;font-size:13px;color:#c4b5fd;line-height:1.6;font-family:Georgia,serif;">${card.desc}</p>
    <a href="${card.url}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:12px;font-family:Georgia,serif;">${card.cta}</a>
  </div>`;
}

function buildUpsellBlock(productName: string): string {
  const name = productName.toLowerCase();
  const cards: UpsellCard[] = [];

  if (name.includes('esencial')) {
    cards.push(UPSELL_CARDS.evolutiva, UPSELL_CARDS.parejas);
  } else if (name.includes('evolutiva') || name.includes('evolutivo')) {
    cards.push(UPSELL_CARDS.laboral, UPSELL_CARDS.parejas);
  } else if (name.includes('pareja') || name.includes('sinastría')) {
    cards.push(UPSELL_CARDS.evolutiva, UPSELL_CARDS.laboral);
  } else {
    cards.push(UPSELL_CARDS.evolutiva, UPSELL_CARDS.parejas);
  }

  return `
  <div style="background:linear-gradient(135deg,#1e0a3c,#2d1058);border-radius:12px;padding:28px 32px;margin:8px 0;">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;font-family:Georgia,serif;text-align:center;">✦ Seguí explorando tu carta</p>
    <p style="margin:0 0 20px;font-size:13px;color:#9b7fd4;text-align:center;font-family:Georgia,serif;">Cada análisis revela una dimensión diferente de quién sos</p>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      ${cards.map(upsellCard).join('')}
    </div>
  </div>`;
}

export async function sendReportEmail({
  to,
  userName,
  productName,
  reportHTML,
  chartDataUrl,
}: {
  to:           string;
  userName:     string;
  productName:  string;
  reportHTML:   string;
  chartDataUrl?: string;
}): Promise<void> {
  const safeHTML = sanitizeHTML(reportHTML);
  const cards    = buildCards(safeHTML);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Tu Reporte Astrológico · Astral Evolution</title>
</head>
<body style="margin:0;padding:0;background:#f0ebff;">

  <div style="background:#f0ebff;padding:40px 16px;">
  <div style="max-width:660px;margin:0 auto;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a0533 0%,#2d1058 50%,#1a0533 100%);border-radius:16px 16px 0 0;padding:48px 40px 40px;text-align:center;">
      <p style="margin:0 0 16px;font-size:20px;letter-spacing:10px;color:#c9a96e;">✦ ✦ ✦</p>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:normal;letter-spacing:5px;color:#f0e6ff;font-family:Georgia,serif;">ASTRAL EVOLUTION</h1>
      <p style="margin:0;font-size:11px;color:#9b7fd4;letter-spacing:3px;text-transform:uppercase;font-family:Georgia,serif;">Astrología Evolutiva Personalizada</p>
      <div style="width:60px;height:1px;background:#c9a96e;margin:24px auto;"></div>
      <p style="margin:0;font-size:14px;color:#c4b5fd;font-family:Georgia,serif;">Tu análisis está listo, <strong style="color:#f0e6ff;">${userName}</strong></p>
    </div>

    <!-- Saludo -->
    <div style="background:#ffffff;padding:32px 40px;border-left:4px solid #7c3aed;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7c3aed;font-family:Georgia,serif;">✦ ${productName}</p>
      <p style="margin:12px 0 10px;font-size:16px;color:#2d1058;line-height:1.7;font-family:Georgia,serif;">
        Hola <strong>${userName}</strong>,
      </p>
      <p style="margin:0 0 10px;font-size:15px;color:#4b3268;line-height:1.85;font-family:Georgia,serif;">
        Lo que encontrarás a continuación ha sido preparado especialmente para vos, basado en la configuración única del cielo en el momento de tu nacimiento. Este es un análisis personal y confidencial.
      </p>
      <p style="margin:0;font-size:15px;color:#4b3268;line-height:1.85;font-family:Georgia,serif;">
        Tomá el tiempo que necesites para leerlo con calma.
      </p>
    </div>

    <!-- Carta astrológica -->
    ${chartDataUrl ? `
    <div style="background:#f8f5ff;padding:32px 24px 8px;text-align:center;">
      <p style="margin:0 0 16px;font-size:11px;letter-spacing:3px;color:#9b7fd4;text-transform:uppercase;font-family:Georgia,serif;">✦ Tu Carta Natal ✦</p>
      <img src="${chartDataUrl}" width="380" alt="Carta Natal Astrológica"
        style="border-radius:50%;border:2px solid #c9a96e;width:100%;max-width:380px;height:auto;display:block;margin:0 auto;" />
    </div>` : ''}

    <!-- Separador -->
    <div style="background:#f8f5ff;padding:24px 24px 16px;">
      <div style="width:80px;height:1px;background:#c9a96e;margin:0 auto 24px;"></div>

      <!-- Tarjetas del reporte -->
      ${cards}
    </div>

    <!-- Upsell -->
    <div style="padding:0 0 8px;">
      ${buildUpsellBlock(productName)}
    </div>

    <!-- Footer -->
    <div style="background:#1a0533;border-radius:0 0 16px 16px;padding:32px 40px;text-align:center;">
      <p style="margin:0 0 8px;font-size:14px;letter-spacing:8px;color:#c9a96e;">✦ ✦ ✦</p>
      <p style="margin:0 0 6px;font-size:12px;color:#9b7fd4;">© 2026 Astral Evolution · Todos los derechos reservados</p>
      <p style="margin:0;font-size:11px;color:#5b3a8a;">Este análisis es personal y confidencial · lecturas@astralevolution.com</p>
    </div>

  </div>
  </div>

</body>
</html>`;

  await sgMail.send({
    to,
    from: { email: 'lecturas@astralevolution.com', name: 'Tu Equipo de Análisis · Astral Evolution' },
    subject: `✦ Tu ${productName} está listo, ${userName}`,
    html,
  });

  console.log(`[Email] Reporte enviado a ${to} via SendGrid ✓`);
}
