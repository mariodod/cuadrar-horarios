"use client";

import { useEffect, useState } from "react";

interface Overlap {
  day: string;
  start: string;
  end: string;
}

export default function OverlapGrid({ overlaps }: { overlaps: Overlap[] }) {
  const [grouped, setGrouped] = useState<Map<string, Overlap[]>>(new Map());

  useEffect(() => {
    const map = new Map<string, Overlap[]>();
    for (const o of overlaps) {
      if (!map.has(o.day)) {
        map.set(o.day, []);
      }
      map.get(o.day)!.push(o);
    }
    setGrouped(map);
  }, [overlaps]);

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
                    className="flex items-center justify-between py-2 border-b border-zinc-50 dark:border-zinc-800/30 last:border-0"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {o.start.substring(0, 5)} – {o.end.substring(0, 5)}
                    </span>
                    <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      Disponible
                    </span>
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
