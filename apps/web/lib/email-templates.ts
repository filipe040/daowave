/**
 * Generate base email template with BETA branding (high-contrast, email-client safe)
 */
export function getBetaEmailTemplate(options: EmailTemplateOptions): string {
  const {
    title,
    content,
    showBetaBanner = config.env.isStaging,
    supportEmail = config.app.supportEmail || "support@7eventickets.pt",
    downloadLink,
    downloadLinkExpiresAt,
  } = options;

  const year = new Date().getFullYear();

  const betaBanner = showBetaBanner
    ? `
      <div style="
        margin: 0 0 16px 0;
        padding: 12px 14px;
        border-radius: 14px;
        background: rgba(245,158,11,.16);
        border: 1px solid rgba(245,158,11,.35);
        color: #fde68a;
        font-size: 13px;
        line-height: 1.5;
        font-weight: 700;
      ">
        ⚠️ AMBIENTE BETA — Email de teste
      </div>
    `
    : "";

  const downloadSection = downloadLink
    ? `
      <div style="
        margin: 18px 0 0 0;
        padding: 16px;
        border-radius: 16px;
        background: rgba(255,255,255,.05);
        border: 1px solid rgba(255,255,255,.10);
      ">
        <div style="font-size: 13px; color: rgba(255,255,255,.65); text-transform: uppercase; letter-spacing: .12em;">
          Download
        </div>
        <div style="margin-top: 8px; font-size: 14px; color: rgba(255,255,255,.88);">
          Pode descarregar o seu bilhete através do botão abaixo.
        </div>

        <!-- Bulletproof button -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 14px;">
          <tr>
            <td align="center" bgcolor="#ffffff" style="border-radius: 999px;">
              <a href="${downloadLink}"
                style="
                  display: inline-block;
                  padding: 12px 18px;
                  border-radius: 999px;
                  background: #ffffff;
                  color: #0b0b0b;
                  text-decoration: none;
                  font-weight: 800;
                  font-size: 13px;
                  letter-spacing: .02em;
                ">
                Descarregar Bilhete
              </a>
            </td>
          </tr>
        </table>

        ${downloadLinkExpiresAt
      ? `<div style="margin-top: 10px; font-size: 12px; color: rgba(255,255,255,.60);">
                Este link expira em ${downloadLinkExpiresAt.toLocaleString("pt-PT")}
              </div>`
      : ""
    }

        <div style="margin-top: 10px; font-size: 12px; color: rgba(255,255,255,.60); line-height: 1.5;">
          <strong style="color: rgba(255,255,255,.80);">Nota:</strong> por segurança, o link tem validade limitada.
          Se expirar, gere um novo na área <strong>Meus Bilhetes</strong>.
        </div>
      </div>
    `
    : "";

  return `
<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${title}</title>
  </head>

  <body style="margin:0; padding:0; background:#050505;">
    <!-- Preheader (hidden) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      ${title} — 7even Tickets
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050505; padding: 24px 12px;">
      <tr>
        <td align="center">
          <!-- Container -->
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">
            <tr>
              <td style="
                border-radius: 20px;
                overflow: hidden;
                border: 1px solid rgba(255,255,255,.10);
                background: #0b0b0b;
              ">
                <!-- Header -->
                <div style="
                  padding: 22px 22px 18px 22px;
                  background: radial-gradient(1200px 400px at 10% 0%, rgba(99,102,241,.28) 0%, rgba(6,182,212,.18) 35%, rgba(0,0,0,0) 70%),
                              #0b0b0b;
                  border-bottom: 1px solid rgba(255,255,255,.10);
                  text-align: left;
                ">
                  <div style="font-size: 11px; color: rgba(255,255,255,.55); letter-spacing: .14em; text-transform: uppercase; font-weight: 700;">
                    7even Tickets
                  </div>
                  <div style="margin-top: 8px; font-size: 22px; line-height: 1.25; color: rgba(255,255,255,.92); font-weight: 800;">
                    ${title}
                  </div>
                </div>

                <!-- Body -->
                <div style="padding: 18px 22px 22px 22px; color: rgba(255,255,255,.80); font-size: 14px; line-height: 1.65;">
                  ${betaBanner}

                  <div>
                    ${content}
                  </div>

                  ${downloadSection}

                  <!-- Support -->
                  <div style="margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.10);">
                    <div style="font-size: 12px; color: rgba(255,255,255,.60);">
                      Precisa de ajuda? 
                      <a href="mailto:${supportEmail}" style="color:#ffffff; text-decoration: underline; font-weight: 700;">
                        ${supportEmail}
                      </a>
                    </div>

                    ${showBetaBanner
      ? `<div style="margin-top: 10px; font-size: 11px; color: rgba(255,255,255,.45); line-height: 1.5;">
                            Ambiente de teste. Bilhetes enviados apenas para demonstração.
                          </div>`
      : ""
    }
                  </div>
                </div>

                <!-- Footer -->
                <div style="
                  padding: 14px 22px;
                  background: rgba(255,255,255,.03);
                  border-top: 1px solid rgba(255,255,255,.10);
                  text-align: center;
                  font-size: 11px;
                  color: rgba(255,255,255,.55);
                ">
                  © ${year} 7even Tickets. Todos os direitos reservados.
                </div>
              </td>
            </tr>

            <!-- Tiny spacer -->
            <tr><td style="height:14px;"></td></tr>

            <!-- Unsubscribe/legal placeholder (se precisares depois) -->
            <tr>
              <td align="center" style="font-size: 11px; color: rgba(255,255,255,.40);">
                Enviado automaticamente. Não respondas a este email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}