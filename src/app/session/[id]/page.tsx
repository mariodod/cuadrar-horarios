import { notFound, redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import OverlapGrid from "../../components/overlap-grid";
import CopyLinkButton from "../../components/copy-link-button";

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

type Session = {
  id: string;
  title: string;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  participants: (Participant & { profiles: Profile | null })[];
  availabilities: Availability[];
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: session, error } = await supabase
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
      )
    `)
    .eq("id", id)
    .single();

  if (error || !session) {
    notFound();
  }

  // Verificar que el usuario sea participante de la sesión
  const isParticipant = session.participants.some(
    (p: { user_id: string }) => p.user_id === user.id
  );
  if (!isParticipant) {
    notFound();
  }

  // Calcular overlaps (intersecciones de disponibilidad entre participantes)
  const byDayAndUser = new Map<
    string,
    Map<string, Array<{ start_time: string; end_time: string }>>
  >();

  for (const a of session.availabilities ?? []) {
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

  // Agrupar disponibilidades por usuario para mostrarlas
  const availabilityByUser = new Map<
    string,
    { name: string; email: string | null; blocks: Availability[] }
  >();

  for (const p of session.participants) {
    const key = p.user_id;
    if (!availabilityByUser.has(key)) {
      availabilityByUser.set(key, {
        name: p.profiles?.name || p.profiles?.email || "Usuario",
        email: p.profiles?.email || null,
        blocks: [],
      });
    }
  }

  for (const a of session.availabilities ?? []) {
    const userInfo = availabilityByUser.get(a.user_id);
    if (userInfo) {
      userInfo.blocks.push(a);
    }
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
            />
          </section>
        </div>
      </main>
    </div>
  );
}
