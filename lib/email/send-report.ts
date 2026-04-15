/**
 * lib/email/send-report.ts
 * Email del reporte astrológico — diseño premium oscuro, consistente con astralevolution.com
 */

export interface ReportEmailData {
  toEmail: string;
  toName: string;
  productName: string;
  productSlug: string;
  reportContent: string;
  transactionId: string;
}

// Convierte **negrita** y saltos de línea a HTML seguro para email
function markdownToEmailHTML(text: string): string {
  return text
    .split('\n\n')
    .map((paragraph) => {
      const withBold = paragraph
        .trim()
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#c4b5fd;font-weight:600;">$1</strong>');
      // Si el párrafo empieza con un título en negrita, renderizar como sección
      if (withBold.startsWith('<strong')) {
        return `
          <div style="margin-bottom:28px;">
            <div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(139,92,246,0.2);">
              ${withBold.replace(/<\/strong>.*/, '</strong>')}
            </div>
            <p style="color:#d1d5db;font-size:15px;line-height:1.85;margin:0;">
              ${withBold.replace(/^<strong[^>]*>[^<]+<\/strong>\s*—?\s*/, '')}
            </p>
          </div>`;
      }
      return `<p style="color:#d1d5db;font-size:15px;line-height:1.85;margin:0 0 20px;">${withBold}</p>`;
    })
    .join('');
}

const PRODUCT_ICONS: Record<string, string> = {
  'lectura-esencial': '🌙',
  'consulta-evolutiva': '⭐',
  'especial-parejas': '✨',
};

const PRODUCT_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  'lectura-esencial': {
    primary: 'rgba(139,92,246,0.6)',
    secondary: 'rgba(99,102,241,0.3)',
    glow: '139,92,246',
  },
  'consulta-evolutiva': {
    primary: 'rgba(59,130,246,0.6)',
    secondary: 'rgba(99,102,241,0.3)',
    glow: '59,130,246',
  },
  'especial-parejas': {
    primary: 'rgba(236,72,153,0.5)',
    secondary: 'rgba(139,92,246,0.3)',
    glow: '236,72,153',
  },
};

export function buildReportEmailHTML(data: ReportEmailData): string {
  const icon = PRODUCT_ICONS[data.productSlug] ?? '🌟';
  const colors = PRODUCT_COLORS[data.productSlug] ?? PRODUCT_COLORS['lectura-esencial'];
  const reportHTML = markdownToEmailHTML(data.reportContent);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${data.productName} · Astral Evolution</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#06060f;-webkit-font-smoothing:antialiased;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#06060f;min-height:100vh;">
  <tr>
    <td align="center" style="padding:40px 16px 60px;">

      <!-- Card principal -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px;">

        <!-- ─── HEADER ─────────────────────────────────────── -->
        <tr>
          <td style="padding-bottom:0;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:linear-gradient(160deg,#0f0a1e 0%,#0a0818 50%,#0d0a20 100%);border-radius:24px 24px 0 0;border:1px solid rgba(139,92,246,0.25);border-bottom:none;overflow:hidden;">
              <tr>
                <td style="padding:48px 40px 36px;text-align:center;">

                  <!-- Logo / marca -->
                  <div style="margin-bottom:28px;">
                    <span style="display:inline-block;padding:8px 20px;border-radius:50px;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.3);color:#a78bfa;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;">
                      ✦ Astral Evolution ✦
                    </span>
                  </div>

                  <!-- Ícono del producto -->
                  <div style="margin-bottom:20px;">
                    <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,${colors.primary},${colors.secondary});border:1px solid rgba(${colors.glow},0.4);font-size:32px;line-height:72px;text-align:center;">
                      ${icon}
                    </div>
                  </div>

                  <!-- Título -->
                  <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:28px;font-weight:normal;color:#f9fafb;letter-spacing:-0.5px;">
                    Tu ${data.productName}
                  </h1>
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:16px;color:#9ca3af;">
                    preparada especialmente para
                    <span style="color:#c4b5fd;font-style:italic;"> ${data.toName}</span>
                  </p>

                  <!-- Separador decorativo -->
                  <div style="margin:28px auto 0;max-width:200px;height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.5),transparent);"></div>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ─── INTRO ───────────────────────────────────────── -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#0d0b1a;border-left:1px solid rgba(139,92,246,0.25);border-right:1px solid rgba(139,92,246,0.25);">
              <tr>
                <td style="padding:24px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                    style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:12px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#c4b5fd;line-height:1.7;font-style:italic;">
                          "Las estrellas no determinan tu destino — lo iluminan.
                          Esta lectura es tu mapa del cielo interior."
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ─── SEPARADOR ──────────────────────────────────── -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#0d0b1a;border-left:1px solid rgba(139,92,246,0.25);border-right:1px solid rgba(139,92,246,0.25);">
              <tr>
                <td style="padding:4px 40px 0;">
                  <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent);"></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ─── CONTENIDO DEL REPORTE ───────────────────────── -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#0d0b1a;border-left:1px solid rgba(139,92,246,0.25);border-right:1px solid rgba(139,92,246,0.25);">
              <tr>
                <td style="padding:36px 40px;">
                  ${reportHTML}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ─── CTA ────────────────────────────────────────── -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#0d0b1a;border-left:1px solid rgba(139,92,246,0.25);border-right:1px solid rgba(139,92,246,0.25);">
              <tr>
                <td style="padding:8px 40px 40px;text-align:center;">
                  <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent);margin-bottom:32px;"></div>
                  <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:14px;color:#6b7280;">
                    ¿Querés profundizar aún más en tu camino?
                  </p>
                  <a href="https://astralevolution.com/#productos"
                    style="display:inline-block;padding:14px 32px;border-radius:50px;background:linear-gradient(135deg,rgba(139,92,246,0.8),rgba(99,102,241,0.8));color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">
                    ✨ Explorar más lecturas
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ─── FOOTER ─────────────────────────────────────── -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#090714;border-radius:0 0 24px 24px;border:1px solid rgba(139,92,246,0.15);border-top:none;overflow:hidden;">
              <tr>
                <td style="padding:28px 40px;text-align:center;">
                  <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#4b5563;">
                    ¿Preguntas? Respondé este email o escribinos a
                    <a href="mailto:contacto@astralevolution.com" style="color:#7c3aed;text-decoration:none;">contacto@astralevolution.com</a>
                  </p>
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#374151;">
                    Ref: ${data.transactionId} · © ${year} Astral Evolution · Todos los derechos reservados
                  </p>
                  <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#374151;">
                    <a href="https://astralevolution.com" style="color:#6b21a8;text-decoration:none;">astralevolution.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
      <!-- fin card -->

    </td>
  </tr>
</table>

</body>
</html>`;
}

// ─── Función principal de envío ───────────────────────────────────────────────
export async function sendReportEmail(data: ReportEmailData): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY no configurada');
    return { success: false, error: 'RESEND_API_KEY no configurada' };
  }

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
        subject: `${PRODUCT_ICONS[data.productSlug] ?? '✨'} Tu ${data.productName} está lista, ${data.toName}`,
        html: buildReportEmailHTML(data),
        tags: [
          { name: 'category', value: 'report' },
          { name: 'product', value: data.productSlug },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Email] Error Resend:', err);
      return { success: false, error: err };
    }

    const result = await res.json();
    console.log('[Email] Enviado OK, id:', result.id);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[Email] Error de red:', msg);
    return { success: false, error: msg };
  }
}
