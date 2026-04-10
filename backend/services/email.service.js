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
      <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; color: #1e293b; padding: 40px 32px; border-radius: 24px; border: 1.5px solid #f1f5f9; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
  
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: #7c3aed; padding: 12px 20px; border-radius: 16px; transform: rotate(-3deg);">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; font-style: italic;">🎓 SEA</h1>
          </div>
        </div>

        <h2 style="text-align: center; color: #0f172a; font-size: 22px; font-weight: 800; margin-bottom: 16px;">Recuperar contraseña</h2>
        
        <p style="color: #475569; line-height: 1.6; text-align: center; font-size: 15px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en el <strong>Simulador de Examen Asistido</strong>.
        </p>
        
        <p style="color: #475569; line-height: 1.6; text-align: center; font-size: 15px; margin-bottom: 32px;">
          Haz clic en el botón de abajo para configurar una nueva clave. Ten en cuenta que este enlace expirará en <strong>1 hora</strong>.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #7c3aed; color: #ffffff; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);">
            RESTABLECER AHORA →
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;">

        <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
          Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura. Tu contraseña actual permanecerá activa.
        </p>
        
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px; word-break: break-all; background: #f8fafc; padding: 12px; border-radius: 12px;">
          ¿El botón no funciona? Copia este link: <br>
          <span style="color: #7c3aed;">${resetUrl}</span>
        </p>

        <p style="color: #cbd5e1; font-size: 10px; text-align: center; margin-top: 24px; font-weight: bold; letter-spacing: 2px;">
          SISTEMA SEA • 2026
        </p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail };