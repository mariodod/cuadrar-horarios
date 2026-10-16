"use client";

interface Overlap {
  day: string;
  start: string;
  end: string;
}

interface OverlapGridProps {
  overlaps: Overlap[];
  sessionId: string;
  sessionTitle: string;
}

export default function OverlapGrid({
  overlaps,
  sessionId,
  sessionTitle,
}: OverlapGridProps) {
  if (overlaps.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-6 text-center">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
          Sin coincidencias por ahora
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Ambas personas deben registrar disponibilidad para verse las horas en común.
        </p>
      </div>
    );
  }

  // Agrupar por día
  const grouped = new Map<string, Overlap[]>();
  for (const o of overlaps) {
    if (!grouped.has(o.day)) {
      grouped.set(o.day, []);
    }
    grouped.get(o.day)!.push(o);
  }

  const days = Array.from(grouped.keys()).sort();

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 overflow-hidden">
      <h3 className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 text-lg font-semibold text-zinc-900 dark:text-white">
        Horas en las que coinciden
      </h3>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
        {days.map((day) => {
          const dayOverlaps = grouped.get(day)!;
          const dayDate = new Date(day + "T00:00:00");
          const dayName = dayDate.toLocaleDateString("es-ES", {
            weekday: "long",
          });
          return (
            <div key={day}>
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {dayName.charAt(0).toUpperCase() + dayName.slice(1)},{" "}
                  {dayDate.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </p>
              </div>
              <div className="px-4 py-3">
                {dayOverlaps.map((o, i) => (
                  <div
                    key={i}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 py-2 border-b border-zinc-50 dark:border-zinc-800/30 last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-[120px]">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {o.start.substring(0, 5)}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-500">–</span>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {o.end.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarExportButton
                        sessionId={sessionId}
                        sessionTitle={sessionTitle}
                        day={day}
                        startTime={o.start.substring(0, 5)}
                        endTime={o.end.substring(0, 5)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CalendarExportButtonProps {
  sessionId: string;
  sessionTitle: string;
  day: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

function CalendarExportButton({
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
    <div className="flex items-center gap-1">
      <a
        href={icsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[10px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Descargar .ics"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span className="hidden md:inline">.ics</span>
      </a>
      <a
        href={googleCalendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[10px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Google Calendar"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="hidden md:inline">Google Calendar</span>
      </a>
    </div>
  );
}
