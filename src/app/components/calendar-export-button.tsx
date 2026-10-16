"use client";

interface CalendarExportButtonProps {
  sessionId: string;
  sessionTitle: string;
  day: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export default function CalendarExportButton({
  sessionId,
  sessionTitle,
  day,
  startTime,
  endTime,
}: CalendarExportButtonProps) {
  const startDateTime = `${day.replace(/-/g, "")}T${startTime.replace(/:/g, "")}00Z`;
  const endDateTime = `${day.replace(/-/g, "")}T${endTime.replace(/:/g, "")}00Z`;

  const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(sessionTitle)}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(`Reunión coordinada mediante Cuadrar Horarios. Sesión: ${sessionId}`)}&location=${encodeURIComponent("En línea")}`;

  const icsUrl = `/api/calendar/ics?title=${encodeURIComponent(sessionTitle)}&sessionId=${encodeURIComponent(sessionId)}&day=${encodeURIComponent(day)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&description=${encodeURIComponent(`Reunión coordinada mediante Cuadrar Horarios. Sesión: ${sessionId}`)}&location=${encodeURIComponent("En línea")}`;

  return (
    <div className="flex items-center gap-2">
      <a
        href={icsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Descargar .ics"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>Descargar .ics</span>
      </a>
      <a
        href={googleCalendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Agregar a Google Calendar"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>Google Calendar</span>
      </a>
    </div>
  );
}
