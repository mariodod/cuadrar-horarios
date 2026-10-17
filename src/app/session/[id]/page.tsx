"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import OverlapGrid from "../../components/overlap-grid";
import CopyLinkButton from "../../components/copy-link-button";
import { Button } from "../../components/ui/button";

type Profile = {
  name: string | null;
  email: string | null;
};

type Participant = {
  id: string;
  user_id: string;
  profiles: Profile | null;
};

type Availability = {
  id: string;
  user_id: string;
  day: string;
  start_time: string;
  end_time: string;
};

type Vote = {
  id: string;
  session_id: string;
  overlap_day: string;
  overlap_start_time: string;
  overlap_end_time: string;
  user_id: string;
  vote_type: "yes" | "no" | "maybe";
};

type Session = {
  id: string;
  title: string;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  participants: (Participant & { profiles: Profile | null })[];
  availabilities: Availability[];
  votes: Vote[];
};

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { id } = await params;

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user || authError) {
          router.push("/login");
          return;
        }
        setCurrentUserId(user.id);

        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select(`
            *,
            participants (
              id,
              user_id,
              profiles ( name, email )
            ),
            availabilities (
              id,
              user_id,
              day,
              start_time,
              end_time
            ),
            votes (
              id,
              session_id,
              overlap_day,
              overlap_start_time,
              overlap_end_time,
              user_id,
              vote_type
            )
          `)
          .eq("id", id)
          .single();

        if (sessionError || !sessionData) {
          if (mounted) {
            setError("Sesión no encontrada");
          }
          return;
        }

        // Verificar que el usuario sea participante de la sesión
        const isParticipant = sessionData.participants.some(
          (p: { user_id: string }) => p.user_id === user.id
        );
        if (!isParticipant) {
          if (mounted) {
            setError("No tienes acceso a esta sesión");
          }
          return;
        }

        if (mounted) {
          setSession(sessionData);
        }
      } catch (err) {
        if (mounted) {
          setError("Error cargando la sesión");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSession();
    return () => {
      mounted = false;
    };
  }, [params, router, supabase]);

  // Calcular overlaps (intersecciones de disponibilidad entre participantes)
  const byDayAndUser = new Map<
    string,
    Map<string, Array<{ start_time: string; end_time: string }>>
  >();

  for (const a of session?.availabilities ?? []) {
    if (!byDayAndUser.has(a.day)) {
      byDayAndUser.set(a.day, new Map());
    }
    const byUser = byDayAndUser.get(a.day)!;
    if (!byUser.has(a.user_id)) {
      byUser.set(a.user_id, []);
    }
    byUser.get(a.user_id)!.push({
      start_time: a.start_time,
      end_time: a.end_time,
    });
  }

  const overlaps: Array<{
    day: string;
    start: string;
    end: string;
  }> = [];

  for (const [day, byUser] of byDayAndUser) {
    const users = Array.from(byUser.entries());
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const [, blocks1] = users[i];
        const [, blocks2] = users[j];

        for (const b1 of blocks1) {
          for (const b2 of blocks2) {
            const start =
              b1.start_time > b2.start_time ? b1.start_time : b2.start_time;
            const end =
              b1.end_time < b2.end_time ? b1.end_time : b2.end_time;
            if (start < end) {
              overlaps.push({ day, start, end });
            }
          }
        }
      }
    }
  }

  // Construir mapa de votos del usuario actual y conteos por coincidencia
  const userVotes: Record<string, "yes" | "no" | "maybe"> = {};
  const voteCounts: Record<string, { yes: number; no: number; maybe: number }> = {};

  for (const v of session?.votes ?? []) {
    const key = `${v.overlap_day}|${v.overlap_start_time}|${v.overlap_end_time}`;

    if (!voteCounts[key]) {
      voteCounts[key] = { yes: 0, no: 0, maybe: 0 };
    }
    const voteType = v.vote_type as "yes" | "no" | "maybe";
    voteCounts[key][voteType] += 1;

    if (v.user_id === currentUserId) {
      userVotes[key] = v.vote_type;
    }
  }

  // Agrupar disponibilidades por usuario para mostrarlas
  const availabilityByUser = new Map<
    string,
    { name: string; email: string | null; blocks: Availability[] }
  >();

  for (const p of session?.participants ?? []) {
    const key = p.user_id;
    if (!availabilityByUser.has(key)) {
      availabilityByUser.set(key, {
        name: p.profiles?.name || p.profiles?.email || "Usuario",
        email: p.profiles?.email || null,
        blocks: [],
      });
    }
  }

  for (const a of session?.availabilities ?? []) {
    const userInfo = availabilityByUser.get(a.user_id);
    if (userInfo) {
      userInfo.blocks.push(a);
    }
  }

  async function handleVoteChange(
    day: string,
    start: string,
    end: string,
    voteType: "yes" | "no" | "maybe" | null
  ) {
    // El voto se guarda en el cliente mediante VoteButton (usa Supabase directamente)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-32 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            {error || "Sesión no encontrada"}
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              asChild
              className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <a href="/session/new">Crear nueva sesión</a>
            </Button>
            <Button
              asChild
              className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <a href="/">Volver al inicio</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {session.title}
            </h1>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {session.participants.length} participantes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">
              {session.participants.length} persona(s)
            </p>
            <CopyLinkButton sessionId={session.id} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Participantes ({session.participants.length})
            </h2>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-4">
              {session.participants.map((p: Participant) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {p.profiles?.name || p.profiles?.email || "Usuario"}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    {p.user_id === session.created_by ? "Creador" : "Invitado"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <a
                href={`/session/${session.id}/availability`}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Registrar mi disponibilidad
              </a>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Disponibilidad registrada
            </h2>
            <div className="space-y-4">
              {Array.from(availabilityByUser.entries()).map(
                ([userId, info]) => (
                  <div
                    key={userId}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                        {info.name}
                      </h3>
                      <span className="text-xs text-zinc-500 dark:text-zinc-500">
                        {info.blocks.length} bloque(s)
                      </span>
                    </div>
                    {info.blocks.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                        Sin disponibilidad registrada
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {info.blocks.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800/30 last:border-0"
                          >
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {new Date(b.day + "T00:00:00").toLocaleDateString("es-ES", {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </span>
                            <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
                              {b.start_time.substring(0, 5)} – {b.end_time.substring(0, 5)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Horas en las que coinciden
            </h2>
            <OverlapGrid
              overlaps={overlaps}
              sessionId={session.id}
              sessionTitle={session.title}
              userVotes={userVotes}
              voteCounts={voteCounts}
              onVoteChange={handleVoteChange}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
