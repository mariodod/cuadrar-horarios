"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";

const createSessionSchema = z.object({
  title: z.string().min(1, "Ingresa un título para la sesión").max(100),
  inviteEmail: z.string().email("Ingresa un correo válido").optional().or(z.literal("")),
});

type CreateSessionForm = z.infer<typeof createSessionSchema>;

export default function NewSessionPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      title: "",
      inviteEmail: "",
    },
  });

  const onSubmit = async (data: CreateSessionForm) => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Debes iniciar sesión para crear una cuadrada");
      setLoading(false);
      return;
    }

    // Asegurar que el perfil exista
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || null,
        });

      if (profileError) {
        setError("Error al crear perfil: " + profileError.message);
        setLoading(false);
        return;
      }
    }

    const { data: session, error: supabaseError } = await supabase
      .from("sessions")
      .insert({
        title: data.title,
        created_by: user.id,
      })
      .select()
      .single();

    if (supabaseError || !session) {
      setError(supabaseError?.message || "Error al crear la sesión");
      setLoading(false);
      return;
    }

    // Registrar al creador como participante
    await supabase.from("participants").insert({
      session_id: session.id,
      user_id: user.id,
    });

    // Obtener perfil del creador para enviar email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", user.id)
      .single();

    const sessionLink = `${window.location.origin}/session/${session.id}`;

    // Enviar email de confirmación al creador
    if (profile?.email) {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: profile.email,
          subject: `✅ Sesión creada: ${data.title}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">📅 Cuadrar Horarios</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                  <h2 style="color: #667eea; margin-top: 0;">Sesión creada exitosamente</h2>
                  <p>Hola ${profile.name || ""}, has creado la sesión: <strong>${data.title}</strong></p>
                  <p>Comparte este enlace para que los demás participantes se unan y registren su disponibilidad:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${sessionLink}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                      Ver sesión
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #666;">
                    Enlace: <a href="${sessionLink}" style="color: #667eea; word-break: break-all;">${sessionLink}</a>
                  </p>
                  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                  <p style="font-size: 12px; color: #999;">
                    Este es un email automático de Cuadrar Horarios.
                  </p>
                </div>
              </body>
            </html>
          `,
        }),
      });
    }

    // Enviar invitación por email si se proporcionó un correo de invitado
    if (data.inviteEmail) {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: data.inviteEmail,
          subject: `📅 Te invitan a cuadrar horarios: ${data.title}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">📅 Cuadrar Horarios</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                  <h2 style="color: #667eea; margin-top: 0;">Te han invitado a cuadrar horarios</h2>
                  <p>${user.email} te ha invitado a participar en la sesión: <strong>${data.title}</strong></p>
                  <p>Por favor, registra tu disponibilidad para encontrar las horas en las que coincidan.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${sessionLink}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                      Registrar mi disponibilidad
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #666;">
                    Enlace: <a href="${sessionLink}" style="color: #667eea; word-break: break-all;">${sessionLink}</a>
                  </p>
                  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                  <p style="font-size: 12px; color: #999;">
                    Este es un email automático de Cuadrar Horarios.
                  </p>
                </div>
              </body>
            </html>
          `,
        }),
      });
    }

    // Usar window.location.href para forzar recarga completa y enviar cookies de auth correctamente
    window.location.href = `/session/${session.id}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Nueva cuadrada
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Crea una sesión y opcionalmente invita a alguien por email.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Título de la sesión
            </label>
            <input
              {...register("title")}
              type="text"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Cena con Ana"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email de invitación (opcional)
            </label>
            <input
              {...register("inviteEmail")}
              type="email"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="amigo@correo.com"
            />
            {errors.inviteEmail && (
              <p className="text-sm text-red-500">{errors.inviteEmail.message}</p>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Si dejas este campo vacío, solo se creará la sesión y podrás compartir el link manualmente.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creando..." : "Crear sesión"}
          </Button>
        </form>
      </div>
    </div>
  );
}
