"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase-client";
import AvailabilityForm from "../../../components/availability-form";
import BackButton from "../../../components/back-button";

export default function AvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [session, setSession] = useState<{ id: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { id } = await params;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("id, title")
          .eq("id", id)
          .single();

        if (sessionError || !sessionData) {
          setError("Sesión no encontrada");
          setLoading(false);
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

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900">
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
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton />
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

          <AvailabilityForm
            sessionId={session.id}
            onSuccess={() => {
              router.push(`/session/${session.id}`);
            }}
          />
        </div>
      </main>
    </div>
  );
}
