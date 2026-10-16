"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Database } from "../../types/supabase";

type AvailabilityInsert = Database["public"]["Tables"]["availabilities"]["Insert"];

const availabilitySchema = z.object({
  day: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  start_time: z.string().min(1, "Hora de inicio requerida"),
  end_time: z.string().min(1, "Hora de fin requerida"),
});

type AvailabilityForm = z.infer<typeof availabilitySchema>;

interface AvailabilityFormProps {
  sessionId: string;
  onSuccess: () => void;
}

export default function AvailabilityForm({
  sessionId,
  onSuccess,
}: AvailabilityFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AvailabilityForm>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      day: "",
      start_time: "09:00",
      end_time: "12:00",
    },
  });

  const onSubmit = async (data: AvailabilityForm) => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Debes iniciar sesión");
      setLoading(false);
      return;
    }

    const availability = {
      session_id: sessionId,
      user_id: user.id,
      day: data.day,
      start_time: data.start_time,
      end_time: data.end_time,
    };

    const { error: supabaseError } = await supabase
      .from("availabilities")
      .insert(availability);

    if (supabaseError) {
      setError(supabaseError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    reset({
      day: "",
      start_time: "09:00",
      end_time: "12:00",
    });
    onSuccess();
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Disponibilidad guardada
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Tu bloque de disponibilidad se ha registrado correctamente.
        </p>
        <Button
          onClick={() => {
            setSuccess(false);
            onSuccess();
          }}
          className="mt-4"
        >
          Agregar otro bloque
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          Tu disponibilidad
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Selecciona el día y el rango horario en el que estás disponible.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Día
          </label>
          <input
            {...register("day")}
            type="date"
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.day && (
            <p className="text-sm text-red-500">{errors.day.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Hora de inicio
            </label>
            <input
              {...register("start_time")}
              type="time"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.start_time && (
              <p className="text-sm text-red-500">{errors.start_time.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Hora de fin
            </label>
            <input
              {...register("end_time")}
              type="time"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.end_time && (
              <p className="text-sm text-red-500">{errors.end_time.message}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Guardando..." : "Guardar disponibilidad"}
        </Button>
      </form>
    </div>
  );
}
