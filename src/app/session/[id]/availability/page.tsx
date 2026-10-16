import { notFound, redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import AvailabilityForm from "../../../components/availability-form";

export default async function AvailabilityPage({
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
    .select("id, title")
    .eq("id", id)
    .single();

  if (error || !session) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="Volver"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {session.title}
            </h1>
          </div>
          <a
            href={`/session/${session.id}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Volver a la sesión
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Registrar tu disponibilidad
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Marca los días y horarios en los que estás disponible.
            </p>
          </div>

          <AvailabilityForm sessionId={id} onSuccess={() => {}} />
        </div>
      </main>
    </div>
  );
}
