"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase-client";
import AvailabilityForm from "../../../components/availability-form";
import BackButton from "../../../components/back-button";

type Availability = {
  id: string;
  session_id: string;
  user_id: string;
  day: string;
  start_time: string;
  end_time: string;
};

export default function AvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [session, setSession] = useState<{ id: string; title: string } | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadData() {
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

        const { data: availData, error: availError } = await supabase
          .from("availabilities")
          .select("*")
          .eq("session_id", id)
          .eq("user_id", user.id)
          .order("day", { ascending: true })
          .order("start_time", { ascending: true });

        if (availError) {
          setError(availError.message);
          setLoading(false);
          return;
        }

        if (mounted) {
          setSession(sessionData);
          setAvailabilities(availData ?? []);
          setLoading(false);
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

    loadData();
    return () => {
      mounted = false;
    };
  }, [params, router, supabase]);

  async function deleteAvailability(id: string) {
    if (!window.confirm("¿Estás seguro de eliminar este bloque de disponibilidad?")) {
      return;
    }
    const { error: delError } = await supabase
      .from("availabilities")
      .delete()
      .eq("id", id);
    if (delError) {
      setError(delError.message);
      return;
    }
    setAvailabilities(prev => prev.filter(a => a.id !== id));
    setEditingId(null);
  }

  function handleEdit(block: Availability) {
    setEditingId(block.id);
  }

  function handleCancelEdit() {
    setEditingId(null);
  }

  async function handleSaveSuccess() {
    setEditingId(null);
    // Recargar disponibilidades
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: availData } = await supabase
      .from("availabilities")
      .select("*")
      .eq("session_id", id)
      .eq("user_id", user?.id)
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });
    setAvailabilities(availData ?? []);

    // Notificar a otros participantes por email
    try {
      const { data: participants } = await supabase
        .from("participants")
        .select(`
          user_id,
          profiles ( email, name )
        `)
        .eq("session_id", id)
        .neq("user_id", user?.id);

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user?.id)
        .single();

      const sessionLink = `${window.location.origin}/session/${id}`;

      for (const p of participants ?? []) {
        const profiles: any = p.profiles;
        const email = profiles?.email;
        const name = profiles?.name || "Participante";
        if (email) {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email,
              subject: `✅ ${myProfile?.name || "Alguien"} registró su disponibilidad en: ${session?.title}`,
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 24px;">✅ Cuadrar Horarios</h1>
                    </div>
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                      <h2 style="color: #10b981; margin-top: 0;">¡${myProfile?.name || "Alguien"} registró su disponibilidad!</h2>
                      <p>Hola ${name}, ${myProfile?.name || "Alguien"} acaba de registrar su disponibilidad en la sesión:</p>
                      <p><strong>${session?.title}</strong></p>
                      <p>Entra y revisa si ya hay horas en las que coincidan.</p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${sessionLink}" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                          Ver coincidencias
                        </a>
                      </div>
                      <p style="font-size: 14px; color: #666;">
                        Enlace: <a href="${sessionLink}" style="color: #10b981; word-break: break-all;">${sessionLink}</a>
                      </p>
                      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                      <p style="font-size: 12px; color: #999;">
                        Este es un email automático de Cuadrar Horarios. No respondas a este mensaje.
                      </p>
                    </div>
                  </body>
                </html>
              `,
            }),
          });
        }
      }
    } catch (notifyError) {
      console.error("Error enviando notificaciones por email:", notifyError);
      // No bloquear al usuario si falla el email
    }
  }

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
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Tu disponibilidad
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Marca los días y horarios en los que estás disponibles.
            </p>
          </div>

          {/* Lista de bloques existentes */}
          <div className="space-y-3">
            {availabilities.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 p-6 text-center">
                <p className="text-zinc-500 dark:text-zinc-400">
                  No hay disponibilidad registrada todavía.
                </p>
              </div>
            ) : (
              <>
                {availabilities.map((block) => (
                  <div
                    key={block.id}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {new Date(block.day + "T00:00:00").toLocaleDateString("es-ES", {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {block.start_time.substring(0, 5)} – {block.end_time.substring(0, 5)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(block)}
                        className="text-xs px-2 py-1 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteAvailability(block.id)}
                        className="text-xs px-2 py-1 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Formulario de agregar/editar */}
          <AvailabilityForm
            sessionId={session.id}
            editingId={editingId}
            editingBlock={availabilities.find(b => b.id === editingId) || null}
            onCancel={handleCancelEdit}
            onSuccess={handleSaveSuccess}
          />
        </div>
      </main>
    </div>
  );
}
