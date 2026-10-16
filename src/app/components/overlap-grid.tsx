"use client";

import VoteButton from "./vote-button";

interface Overlap {
  day: string;
  start: string;
  end: string;
}

type VoteType = "yes" | "no" | "maybe";

interface OverlapGridProps {
  overlaps: Overlap[];
  sessionId: string;
  sessionTitle: string;
  userVotes: Record<string, VoteType>; // key: "${day}|${start}|${end}"
  voteCounts: Record<string, Record<VoteType, number>>; // key: "${day}|${start}|${end}" -> { yes: n, no: n, maybe: n }
  onVoteChange: (day: string, start: string, end: string, voteType: VoteType | null) => void;
}

export default function OverlapGrid({
  overlaps,
  sessionId,
  sessionTitle,
  userVotes,
  voteCounts,
  onVoteChange,
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

  // Calcular totales por voto para mostrar resumen
  const totalYes = overlaps.reduce((acc, o) => {
    const key = `${o.day}|${o.start}|${o.end}`;
    return acc + (voteCounts[key]?.yes || 0);
  }, 0);
  const totalNo = overlaps.reduce((acc, o) => {
    const key = `${o.day}|${o.start}|${o.end}`;
    return acc + (voteCounts[key]?.no || 0);
  }, 0);
  const totalMaybe = overlaps.reduce((acc, o) => {
    const key = `${o.day}|${o.start}|${o.end}`;
    return acc + (voteCounts[key]?.maybe || 0);
  }, 0);

  const totalVotes = totalYes + totalNo + totalMaybe;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 overflow-hidden">
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Horas en las que coinciden
          </h3>
          {totalVotes > 0 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {totalYes} ✓ • {totalMaybe} ~ • {totalNo} ✗
            </span>
          )}
        </div>
      </div>
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
                {dayOverlaps.map((o, i) => {
                  const key = `${o.day}|${o.start}|${o.end}`;
                  const counts = voteCounts[key] || { yes: 0, no: 0, maybe: 0 };
                  const totalForThis = counts.yes + counts.no + counts.maybe;
                  const yesPct = totalForThis > 0 ? Math.round((counts.yes / totalForThis) * 100) : 0;

                  return (
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
                        <VoteButton
                          sessionId={sessionId}
                          overlapDay={o.day}
                          overlapStart={o.start.substring(0, 5)}
                          overlapEnd={o.end.substring(0, 5)}
                          currentVote={userVotes[key] || null}
                          onVoteChange={(voteType) => {
                            onVoteChange(o.day, o.start.substring(0, 5), o.end.substring(0, 5), voteType);
                          }}
                        />
                        {totalForThis > 0 && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            {yesPct}% sí ({totalForThis})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {totalVotes > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Resumen de votos
              </p>
              <p className="text-sm text-zinc-900 dark:text-white">
                {totalVotes} voto{totalVotes === 1 ? "" : "s"} en total
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center gap-1 text-sm">
                <span className="text-green-600">✓</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {totalYes} sí
                </span>
              </span>
              <span className="flex items-center gap-1 text-sm">
                <span className="text-yellow-600">~</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {totalMaybe} quizás
                </span>
              </span>
              <span className="flex items-center gap-1 text-sm">
                <span className="text-red-600">✗</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {totalNo} no
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
