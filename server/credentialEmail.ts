type ResetEmailInput = {
  to: string;
  recipientName: string;
  resetUrl: string;
};

/**
 * Sends through Resend when a sender has been configured in the deployment.
 * The app never logs reset URLs or tokens. During local preview, the caller may
 * expose a temporary reset link to make the complete flow testable.
 */
export async function sendPasswordResetEmail(input: ResetEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;
  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Restablece tu contraseña de Manduca",
      html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#171715"><h2>Hola ${input.recipientName || ""},</h2><p>Hemos recibido una solicitud para restablecer tu contraseña de Manduca.</p><p><a href="${input.resetUrl}" style="display:inline-block;padding:12px 18px;background:#FFD72E;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Crear una nueva contraseña</a></p><p>Este enlace caduca en 30 minutos. Si no has solicitado este cambio, puedes ignorar este email.</p></div>`,
    }),
  });
  return response.ok;
}
