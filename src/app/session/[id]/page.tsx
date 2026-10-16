import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from("sessions")
    .select(`
      *,
      participants (
        id,
        user_id,
        profiles ( name, email )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !session) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {session.title}
            </h1>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Activa
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">
              {session.participants?.length} participante(s)
            </p>
            <button
              className="hidden sm:flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/session/${session.id}`
                );
              }}
            >
              <span>Copiar link</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Participantes
            </h2>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-4">
              {session.participants?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {p.profiles?.name || p.profiles?.email || "Usuario"}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    {p.user_id === session.created_by ? "Creador" : "Invitado"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Disponibilidades
            </h2>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Aquí se mostrarán las horas en las que coincidan ambos
                participantes.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
