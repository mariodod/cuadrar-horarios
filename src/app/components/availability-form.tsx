"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Database } from "../types/supabase";

const availabilitySchema = z.object({
  day: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  start_time: z.string().min(1, "Hora de inicio requerida"),
  end_time: z.string().min(1, "Hora de fin requerida"),
}).refine(
  (data) => data.start_time < data.end_time,
  {
    message: "La hora de fin debe ser posterior a la hora de inicio",
    path: ["end_time"],
  }
);

type AvailabilityForm = z.infer<typeof availabilitySchema>;

interface AvailabilityFormProps {
  sessionId: string;
  editingId: string | null;
  editingBlock: {
    id: string;
    day: string;
    start_time: string;
    end_time: string;
  } | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AvailabilityForm({
  sessionId,
  editingId,
  editingBlock,
  onCancel,
  onSuccess,
}: AvailabilityFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isEditing = editingId !== null && editingBlock !== null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AvailabilityForm>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      day: editingBlock?.day ?? "",
      start_time: editingBlock?.start_time ?? "09:00",
      end_time: editingBlock?.end_time ?? "12:00",
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

    const payload = {
      session_id: sessionId,
      user_id: user.id,
      day: data.day,
      start_time: data.start_time,
      end_time: data.end_time,
    };

    let result;
    if (isEditing && editingId) {
      result = await supabase
        .from("availabilities")
        .update(payload)
        .eq("id", editingId)
        .eq("user_id", user.id);
    } else {
      result = await supabase
        .from("availabilities")
        .insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(false);
    reset({
      day: "",
      start_time: "09:00",
      end_time: "12:00",
    });
    onSuccess();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          {isEditing ? "Editar disponibilidad" : "Registrar disponibilidad"}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          {isEditing
            ? "Modifica el día y el rango horario de tu bloque."
            : "Selecciona el día y el rango horario en el que estás disponible."}
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

        <div className="flex flex-col sm:flex-row gap-2">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (isEditing ? "Actualizando..." : "Guardando...") : (isEditing ? "Actualizar" : "Guardar disponibilidad")}
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
