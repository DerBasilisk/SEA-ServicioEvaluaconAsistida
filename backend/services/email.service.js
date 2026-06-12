const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Tokens de color (light theme de index.css) ────────────────────────────
const C = {
  accent:      "#2B7FE8",
  accentShadow:"rgba(43, 127, 232, 0.25)",
  accentLight: "#C8E6FF",
  bg:          "#ffffff",
  cardBg:      "#f3f3f3fd",
  border:      "#E2E8F0",
  borderLight: "#f1f5f9",
  textPrimary: "#0F2547",
  textSecondary:"#7A9CC5",
  textMuted:   "#94a3b8",
  textFaint:   "#cbd5e1",
  gradient:    "linear-gradient(145deg, #C8E6FF 0%, #A8D4FF 45%, #B8CBFF 100%)",
};

// ── Shell HTML compartido ─────────────────────────────────────────────────
function emailShell({ preheader, body }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SEA</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${C.accentLight};font-family:'Nunito',Arial,sans-serif;">

  <!-- Preheader invisible -->
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;font-size:1px;">
    ${preheader}
  </div>

  <!-- Wrapper con gradiente -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:${C.gradient};min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">

      <!-- Tarjeta -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:500px;background:${C.bg};border-radius:24px;
                    border:1.5px solid ${C.borderLight};
                    box-shadow:0 20px 60px rgba(43,127,232,0.12);">
        <tr><td style="padding:40px 36px 32px;">

          ${body}

          <!-- Footer -->
          <div style="border-top:1px solid ${C.borderLight};margin-top:32px;padding-top:20px;text-align:center;">
            <p style="color:${C.textMuted};font-size:11px;line-height:1.6;margin:0 0 8px;">
              Si no reconoces esta acción, puedes ignorar este mensaje de forma segura.
            </p>
            <p style="color:${C.textFaint};font-size:9px;font-weight:900;letter-spacing:3px;
                       text-transform:uppercase;margin:12px 0 0;">
              Sistema SEA &nbsp;•&nbsp; 2026
            </p>
          </div>

        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

// ── Logo + encabezado reutilizable ────────────────────────────────────────
function logoBlock() {
  return `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:${C.accent};padding:10px 20px;
                  border-radius:16px;transform:rotate(-3deg);
                  box-shadow:0 8px 24px ${C.accentShadow};">
        <span style="color:#fff;font-size:22px;font-weight:900;
                     letter-spacing:-1px;font-style:italic;">🎓 SEA</span>
      </div>
    </div>`;
}

// ── Botón CTA reutilizable ────────────────────────────────────────────────
function ctaButton(href, label) {
  return `
    <div style="text-align:center;margin:32px 0;">
      <a href="${href}"
         style="display:inline-block;background:${C.accent};color:#fff;
                padding:16px 36px;border-radius:14px;text-decoration:none;
                font-weight:900;font-size:14px;letter-spacing:0.1em;
                text-transform:uppercase;
                box-shadow:0 8px 24px ${C.accentShadow};">
        ${label} &nbsp;→
      </a>
    </div>`;
}

// ── Caja de link fallback ─────────────────────────────────────────────────
function fallbackLink(url) {
  return `
    <div style="background:${C.cardBg};border:1px solid ${C.borderLight};
                border-radius:12px;padding:14px;margin-top:20px;text-align:center;">
      <p style="color:${C.textMuted};font-size:11px;margin:0 0 6px;">
        ¿El botón no funciona? Copia este enlace:
      </p>
      <p style="color:${C.accent};font-size:11px;word-break:break-all;margin:0;font-weight:700;">
        ${url}
      </p>
    </div>`;
}

// ── Recuperación de contraseña ────────────────────────────────────────────
async function sendPasswordResetEmail(toEmail, resetToken) {
  const resetUrl = `${process.env.BACKEND_API}/users/reset-password?token=${resetToken}`;

  const body = `
    ${logoBlock()}

    <h2 style="text-align:center;color:${C.textPrimary};font-size:22px;
               font-weight:900;margin:0 0 12px;letter-spacing:-0.5px;">
      Recuperar contraseña
    </h2>

    <p style="color:${C.textSecondary};font-size:14px;line-height:1.7;
               text-align:center;margin:0 0 12px;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en el
      <strong style="color:${C.textPrimary};">Simulador de Examen Asistido</strong>.
    </p>

    <p style="color:${C.textSecondary};font-size:14px;line-height:1.7;
               text-align:center;margin:0;">
      Este enlace expirará en
      <strong style="color:${C.accent};">1 hora</strong>.
      Si no lo solicitaste, ignora este correo.
    </p>

    ${ctaButton(resetUrl, "Restablecer ahora")}
    ${fallbackLink(resetUrl)}
  `;

  await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: toEmail,
    subject: "Recuperación de contraseña – SEA",
    html: emailShell({ preheader: "Restablece tu contraseña de SEA en menos de un minuto.", body }),
  });
}

// ── Verificación de cuenta ────────────────────────────────────────────────
async function sendVerificationEmail(toEmail, verificationToken) {
  const verifyUrl = `${process.env.BACKEND_API}/users/verify-email?token=${verificationToken}`;

  const body = `
    ${logoBlock()}

    <h2 style="text-align:center;color:${C.textPrimary};font-size:22px;
               font-weight:900;margin:0 0 12px;letter-spacing:-0.5px;">
      ¡Bienvenido a SEA!
    </h2>

    <p style="color:${C.textSecondary};font-size:14px;line-height:1.7;
               text-align:center;margin:0 0 12px;">
      Ya casi estás listo. Solo necesitas confirmar tu dirección de correo
      para empezar a entrenar con
      <strong style="color:${C.textPrimary};">inteligencia adaptativa</strong>.
    </p>

    <p style="color:${C.textSecondary};font-size:14px;line-height:1.7;
               text-align:center;margin:0;">
      El enlace expira en
      <strong style="color:${C.accent};">24 horas</strong>.
    </p>

    ${ctaButton(verifyUrl, "Verificar mi cuenta")}

    <!-- Feature pills -->
    <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;
                margin:24px 0 0;text-align:center;">
      ${["🧠 IA Adaptativa","🎯 Enfoque Real","🚀 Progreso Visible"].map(f => `
        <span style="display:inline-block;background:${C.accentLight};
                     color:${C.accent};font-size:9px;font-weight:900;
                     letter-spacing:0.15em;text-transform:uppercase;
                     padding:6px 12px;border-radius:999px;
                     border:1px solid rgba(43,127,232,0.2);">
          ${f}
        </span>`).join("")}
    </div>

    ${fallbackLink(verifyUrl)}
  `;

  await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: toEmail,
    subject: "Verifica tu cuenta – SEA",
    html: emailShell({ preheader: "Un clic y empiezas a entrenar con SEA.", body }),
  });
}

async function sendContactEmail({ name, email, subject, message }) {
  await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: "no-reply@sealearn.online", // o el correo del equipo
    replyTo: email,
    subject: `[Contacto SEA] ${subject}`,
    html: emailShell({
      preheader: `Nuevo mensaje de ${name}`,
      body: `
        ${logoBlock()}
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Correo:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <p><strong>Mensaje:</strong><br/>${message}</p>
      `
    })
  });
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail, sendContactEmail };