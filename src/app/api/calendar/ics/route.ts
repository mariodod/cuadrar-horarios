import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionTitle = searchParams.get("title") || "Reunión - Cuadrar Horarios";
  const sessionId = searchParams.get("sessionId") || "";
  const day = searchParams.get("day") || ""; // YYYY-MM-DD
  const startTime = searchParams.get("startTime") || "09:00"; // HH:MM
  const endTime = searchParams.get("endTime") || "10:00"; // HH:MM
  const description = searchParams.get("description") || "";
  const location = searchParams.get("location") || "En línea";

  // Formatear fecha y hora para iCalendar (UTC)
  // iCalendar usa formato: YYYYMMDDTHHMMSSZ
  const startDateTime = `${day.replace(/-/g, "")}T${startTime.replace(/:/g, "")}00Z`;
  const endDateTime = `${day.replace(/-/g, "")}T${endTime.replace(/:/g, "")}00Z`;
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/g, "") + "Z";
  const uid = `cuadrar-horarios-${sessionId}-${day}-${startTime}@cuadrarhorarios.app`;

  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Cuadrar Horarios//CUADRAR HORARIOS//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${sessionTitle}
X-WR-TIMEZONE:America/Mexico_City
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${sessionTitle}
DESCRIPTION:${description || `Reunión coordinada mediante Cuadrar Horarios. Sesión: ${sessionId}`}
LOCATION:${location}
URL:https://cuadrar-horarios.vercel.app/session/${sessionId}
END:VEVENT
END:VCALENDAR
`.trim();

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="cuadrar-horarios-${sessionId}.ics"`,
    },
  });
}
