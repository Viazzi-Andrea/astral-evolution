/**
 * lib/email/send-birthday.ts
 * Email de cumpleaños con mini Revolución Solar via SendGrid
 * Objetivo: regalo + invitación a comprar lectura completa
 */

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendBirthdayEmail({
    to,
    userName,
    miniReport,
}: {
    to: string;
    userName: string;
    miniReport: string;
}): Promise<void> {
    const html = `
        <!DOCTYPE html>
            <html lang="es">
                <head>
                      <meta charset="UTF-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                                  <title>Feliz Cumpleaños</title>
                                        <style>
                                                body { font-family: Georgia, serif; background: #0a0a1a; color: #e8e0f0; margin: 0; padding: 0; }
                                                        .container { max-width: 700px; margin: 0 auto; padding: 40px 20px; }
                                                                .header { text-align: center; padding: 40px 0 30px; border-bottom: 1px solid #2a1f4a; }
                                                                        .header h1 { font-size: 28px; color: #c9a6f5; letter-spacing: 3px; margin: 0 0 8px; }
                                                                                .header p { color: #9b8ab0; font-size: 16px; margin: 0; }
                                                                                        .greeting { padding: 30px 0 20px; font-size: 16px; color: #c9b8e0; line-height: 1.8; }
                                                                                                .report-content { background: #100d1f; border: 1px solid #2a1f4a; border-radius: 12px; padding: 30px; margin: 20px 0; line-height: 1.8; }
                                                                                                        .cta-block { text-align: center; background: linear-gradient(135deg, #1a0a2e, #2a1f4a); border: 1px solid #6b3fa0; border-radius: 12px; padding: 30px; margin: 30px 0; }
                                                                                                                .cta-block h2 { color: #c9a6f5; font-size: 20px; margin: 0 0 12px; }
                                                                                                                        .cta-block p { color: #9b8ab0; font-size: 14px; margin: 0 0 20px; line-height: 1.6; }
                                                                                                                                .cta-button { display: inline-block; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: bold; letter-spacing: 1px; }
                                                                                                                                        .footer { text-align: center; padding: 30px 0; color: #6b5f80; font-size: 12px; border-top: 1px solid #2a1f4a; margin-top: 30px; }
                                                                                                                                              </style>
                                                                                                                                                  </head>
                                                                                                                                                      <body>
                                                                                                                                                            <div class="container">
                                                                                                                                                                    <div class="header">
                                                                                                                                                                              <h1>✦ ASTRAL EVOLUTION ✦</h1>
                                                                                                                                                                                        <p>🎂 Tu Revolución Solar de Cumpleaños</p>
                                                                                                                                                                                                </div>
                                                                                                                                                                                                
                                                                                                                                                                                                        <div class="greeting">
                                                                                                                                                                                                                  <p>¡Feliz cumpleaños, <strong>${userName}</strong>! 🌟</p>
                                                                                                                                                                                                                            <p>Hoy el Sol regresa exactamente al lugar donde estaba el día que llegaste a este mundo. Eso se llama <strong>Revolución Solar</strong> — y es uno de los momentos más poderosos del año para vos.</p>
                                                                                                                                                                                                                                      <p>Como regalo, preparamos una mirada breve a lo que las estrellas tienen para decirte en este nuevo ciclo:</p>
                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                      <div class="report-content">
                                                                                                                                                                                                                                                                ${miniReport}
                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                <div class="cta-block">
                                                                                                                                                                                                                                                                                          <h2>¿Querés ir más profundo?</h2>
                                                                                                                                                                                                                                                                                                    <p>Esta es solo una pequeña parte de lo que tu carta revela. Una Revolución Solar completa incluye el análisis de las 12 casas, los tránsitos del año y las oportunidades específicas para cada área de tu vida.</p>
                                                                                                                                                                                                                                                                                                              <a href="https://astralevolution.com/productos/consulta-evolutiva" class="cta-button">
                                                                                                                                                                                                                                                                                                                          Ver mi análisis completo →
                                                                                                                                                                                                                                                                                                                                    </a>
                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                    <div class="footer">
                                                                                                                                                                                                                                                                                                                                                              <p>© 2026 Astral Evolution · Todos los derechos reservados</p>
                                                                                                                                                                                                                                                                                                                                                                        <p>Recibís este email porque sos parte de nuestra comunidad. <a href="#" style="color: #6b5f80;">Cancelar suscripción</a></p>
                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                                                                          </body>
                                                                                                                                                                                                                                                                                                                                                                                              </html>
                                                                                                                                                                                                                                                                                                                                                                                                `;

  await sgMail.send({
        to,
        from: {
                email: 'lecturas@astralevolution.com',
                name: 'Astral Evolution',
        },
        subject: `🎂 ¡Feliz cumpleaños ${userName}! Tu regalo astrológico está aquí`,
        html,
  });

  console.log(`[Birthday] Email enviado a ${to} via SendGrid ✓`);
}
