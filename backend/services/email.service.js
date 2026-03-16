const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendPasswordResetEmail(toEmail, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"SEA - Simulador de Examen" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Recuperación de contraseña - SEA",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1e1b4b; color: white; padding: 32px; border-radius: 16px;">
        <h1 style="color: #a78bfa; text-align: center;">🎓 SEA</h1>
        <h2 style="text-align: center;">Recuperá tu contraseña</h2>
        <p style="color: #a5b4fc;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p style="color: #a5b4fc;">Hacé click en el botón para crear una nueva contraseña. El link expira en <strong>1 hora</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Restablecer contraseña
          </a>
        </div>
        <p style="color: #6366f1; font-size: 12px; text-align: center;">
          Si no solicitaste esto, ignorá este email. Tu contraseña no cambiará.
        </p>
        <p style="color: #6366f1; font-size: 11px; text-align: center; word-break: break-all;">
          O copiá este link: ${resetUrl}
        </p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail };