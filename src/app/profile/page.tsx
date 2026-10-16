"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  timezone: string | null;
};

type TimezoneOption = {
  value: string;
  label: string;
};

const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: "America/Mexico_City", label: "México (Centro) - CST/CDT" },
  { value: "America/Mexico_Baja_Norte", label: "México (Baja California) - PST/PDT" },
  { value: "America/Bogota", label: "Colombia - COT" },
  { value: "America/Lima", label: "Perú - PET" },
  { value: "America/Buenos_Aires", label: "Argentina - ART" },
  { value: "America/Santiago", label: "Chile - CLT/CLST" },
  { value: "America/Brasilia", label: "Brasil (Brasilia) - BRT" },
  { value: "America/New_York", label: "Nueva York - EST/EDT" },
  { value: "America/Chicago", label: "Chicago - CST/CDT" },
  { value: "America/Denver", label: "Denver - MST/MDT" },
  { value: "America/Los_Angeles", label: "Los Ángeles - PST/PDT" },
  { value: "Europe/Madrid", label: "España (Madrid) - CET/CEST" },
  { value: "Europe/London", label: "Reino Unido - GMT/BST" },
  { value: "Europe/Paris", label: "París - CET/CEST" },
  { value: "Asia/Tokyo", label: "Tokio - JST" },
  { value: "Asia/Shanghai", label: "Shanghái - CST" },
  { value: "Asia/Kolkata", label: "Calcuta - IST" },
  { value: "Australia/Sydney", label: "Sídney - AEST/AEDT" },
  { value: "UTC", label: "UTC (Tiempo Coordinado Universal)" },
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, name, avatar_url, timezone")
          .eq("id", user.id)
          .single();

        if (profileError) {
          setError(profileError.message);
          setLoading(false);
          return;
        }

        if (mounted) {
          setProfile(profileData);
          setTimezone(profileData?.timezone || null);
        }
      } catch (err) {
        if (mounted) {
          setError("Error cargando perfil");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function saveTimezone() {
    if (!timezone) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Debes iniciar sesión");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ timezone })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setSuccess(true);
      setSaving(false);
    } catch (err) {
      setError("Error guardando zona horaria");
      setSaving(false);
    }
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

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            {error}
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

  if (!profile) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="px-3 py-1.5 text-sm"
            >
              <a href="/">← Volver</a>
            </Button>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Configuración de perfil
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Tu zona horaria
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Selecciona tu zona horaria para que las horas se muestren correctamente en tu región.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">
              ¡Zona horaria guardada correctamente!
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Zona horaria
            </label>
            <select
              value={timezone || ""}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            onClick={saveTimezone}
            disabled={saving || !timezone}
            className="w-full"
          >
            {saving ? "Guardando..." : "Guardar zona horaria"}
          </Button>
        </div>
      </main>
    </div>
  );
}
