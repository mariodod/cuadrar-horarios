"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const createSessionSchema = z.object({
  title: z.string().min(1, "Ingresa un título para la sesión").max(100),
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

    router.push(`/session/${session.id}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Nueva cuadrada
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Crea una sesión y comparte el link con la otra persona.
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
