import { NextResponse } from "next/server";
import { sendEmail } from "../../lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: to, subject, html" },
        { status: 400 }
      );
    }

    const result = await sendEmail({ to, subject, html });

    if (!result.success) {
      return NextResponse.json(
        { error: "Error enviando email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
