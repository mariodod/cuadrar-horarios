import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY no está configurada");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const resend = getResend();
    const data = await resend.emails.send({
      from: "Cuadrar Horarios <noreply@tu-dominio.com>",
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
