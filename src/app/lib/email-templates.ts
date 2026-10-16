export function invitationEmail({
  sessionTitle,
  sessionLink,
  inviterName,
}: {
  sessionTitle: string;
  sessionLink: string;
  inviterName: string;
}) {
  return {
    subject: `📅 ${inviterName} te invita a cuadrar horarios: ${sessionTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📅 Cuadrar Horarios</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #667eea; margin-top: 0;">Hola, ${inviterName} te ha invitado a cuadrar horarios</h2>
            <p>Te han invitado a participar en una cuadrada de horarios llamada: <strong>${sessionTitle}</strong></p>
            <p>Por favor, registra tu disponibilidad para que podamos encontrar las horas en las que coincidan todos los participantes.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${sessionLink}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Registrar mi disponibilidad
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${sessionLink}" style="color: #667eea; word-break: break-all;">${sessionLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
              Este es un email automático de Cuadrar Horarios. No respondas a este mensaje.
            </p>
          </div>
        </body>
      </html>
    `,
  };
}

export function availabilityRegisteredEmail({
  sessionTitle,
  sessionLink,
  registeredBy,
  participantName,
}: {
  sessionTitle: string;
  sessionLink: string;
  registeredBy: string;
  participantName: string;
}) {
  return {
    subject: `✅ ${registeredBy} registró su disponibilidad en: ${sessionTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Cuadrar Horarios</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #10b981; margin-top: 0;">¡${registeredBy} registró su disponibilidad!</h2>
            <p>Hola ${participantName}, ${registeredBy} acaba de registrar su disponibilidad en la sesión:</p>
            <p><strong>${sessionTitle}</strong></p>
            <p>Entra y revisa si ya hay horas en las que coinciden.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${sessionLink}" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Ver coincidencias
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${sessionLink}" style="color: #10b981; word-break: break-all;">${sessionLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
              Este es un email automático de Cuadrar Horarios. No respondas a este mensaje.
            </p>
          </div>
        </body>
      </html>
    `,
  };
}
