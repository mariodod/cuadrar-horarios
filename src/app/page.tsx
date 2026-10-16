import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Cuadrar Horarios
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Encuentra las horas en las que coincidan dos personas
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/session/new"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Crear nueva cuadrada
          </Link>
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-6 py-3 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
