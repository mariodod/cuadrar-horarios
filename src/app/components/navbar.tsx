"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

export default function Navbar() {
  const [user, setUser] = useState<{ email: string | null; name: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted && user) {
          setUser({ email: user.email, name: user.user_metadata?.name } as any);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadUser();
    return () => { mounted = false; };
  }, []);

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white">
            Cuadrar Horarios
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-xs text-zinc-500 dark:text-zinc-500 animate-pulse">Cargando...</span>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {user.name || user.email || "Usuario"}
              </span>
              <Link href="/profile" className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                Perfil
              </Link>
              <button
                onClick={() => {
                  const supabase = createClient();
                  supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs border border-zinc-300 dark:border-zinc-700 rounded px-3 py-1 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 transition-colors"
              >
                Regístrate
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
