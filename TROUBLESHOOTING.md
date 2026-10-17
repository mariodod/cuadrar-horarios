# 🔧 Troubleshooting - Cuadrar Horarios

Este documento recopila los problemas comunes encontrados durante el desarrollo y su solución, para referencia futura.

---

## 1. Error: "Could not find a relationship between 'sessions' and 'votes'"

### Síntoma
Al cargar una sesión (`/session/[id]`), la aplicación falla con el error:
```
Error: Could not find a relationship between 'sessions' and 'votes' in the schema cache
```

### Causa
Supabase usa PostgREST para exponer la API. Cuando hacemos consultas anidadas (por ejemplo, seleccionar una sesión con sus votos incluidos), PostgREST necesita saber que `votes.session_id` es una llave foránea de `sessions.id`. Si el esquema no se ha recargado en Supabase o la llave foránea no existe, PostgREST no puede hacer el `JOIN` implícito.

### Solución

**Paso 1: Ejecutar el SQL en Supabase Editor**

Ir a [Supabase SQL Editor](https://app.supabase.com/project/_/sql) y ejecutar:

```sql
-- Asegurar que la tabla votes exista con la llave foránea correcta
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  overlap_day date not null,
  overlap_start_time time not null,
  overlap_end_time time not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vote_type text not null check (vote_type in ('yes', 'no', 'maybe')),
  created_at timestamptz default now(),
  unique(session_id, overlap_day, overlap_start_time, overlap_end_time, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_votes_session ON public.votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON public.votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_session_day ON public.votes(session_id, overlap_day);

-- RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants can view votes in their sessions" ON public.votes;
DROP POLICY IF EXISTS "users can manage own votes" ON public.votes;

CREATE POLICY "participants can view votes in their sessions"
  ON public.votes FOR SELECT
  USING (
    exists (
      select 1 from public.participants p
      where p.session_id = votes.session_id and p.user_id = auth.uid()
    )
  );

CREATE POLICY "users can manage own votes"
  ON public.votes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Paso 2: Recargar el esquema en Supabase**

1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Ir a **Settings** → **API**
3. Buscar la sección **"Reload schema"** y hacer clic en el botón

Esto le dice a PostgREST que refresque su caché de relaciones entre tablas.

**Paso 3: Hacer Redeploy en Vercel**

Después de recargar el esquema, hacer redeploy en Vercel para que los cambios de código surtan efecto.

---

### Prevención
- Siempre que se agregue una nueva tabla con llaves foráneas, ejecutar primero el SQL en Supabase, luego recargar el esquema, y finalmente hacer redeploy.
- No modificar el código frontend antes de que el esquema de base de datos esté listo.

---

## 2. Error 404 al crear una sesión

### Síntoma
Al crear una sesión y ser redirigido a `/session/[id]`, aparece un error 404 o "Sesión no encontrada".

### Causa posible 1: Cookies de autenticación no llegan al servidor
Cuando se usa `router.push()` en Next.js App Router, el navegador no siempre envía las cookies de autenticación de Supabase en la nueva petición del servidor. Esto hace que el middleware no pueda autenticar al usuario y falle al cargar la sesión.

**Solución:** Usar `window.location.href = /session/${session.id}` en lugar de `router.push()` para forzar una recarga completa del navegador y enviar todas las cookies correctamente.

```typescript
// ✅ Correcto
window.location.href = `/session/${session.id}`;

// ❌ Problema
router.push(`/session/${session.id}`);
```

### Causa posible 2: El perfil del usuario no existe
Si el usuario se autenticó pero no tiene un registro en la tabla `public.profiles`, la consulta puede fallar porque `created_by` referencia a `profiles.id`.

**Solución:** Antes de crear la sesión, verificar que el perfil exista y crearlo si no existe:

```typescript
const { data: existingProfile } = await supabase
  .from("profiles")
  .select("id, email, name")
  .eq("id", user.id)
  .single();

if (!existingProfile) {
  await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
    });
}
```

---

## 3. Error: RLS (Row Level Security) bloquea acceso a tablas

### Síntoma
Error: `new row violates row-level security policy for table "sessions"` o similar al insertar o leer datos.

### Causa
Las políticas de RLS en Supabase restringen el acceso a las tablas basándose en `auth.uid()`. Si las políticas no están correctamente configuradas, el usuario autenticado no puede leer o escribir datos.

### Solución

Ejecutar en Supabase SQL Editor:

```sql
-- Sesiones: permitir insert a usuarios autenticados, select solo a participantes
DROP POLICY IF EXISTS "users can create sessions" ON public.sessions;
CREATE POLICY "users can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "participants can view sessions they join" ON public.sessions;
CREATE POLICY "participants can view sessions they join"
  ON public.sessions FOR SELECT
  USING (
    exists (
      select 1 from public.participants p
      where p.session_id = id and p.user_id = auth.uid()
    )
  );

-- Participantes: usuarios ven sus propias filas, pueden insertar sus propias filas
DROP POLICY IF EXISTS "users can view own participant records" ON public.participants;
DROP POLICY IF EXISTS "users can join sessions" ON public.participants;

CREATE POLICY "users can view own participant records"
  ON public.participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can join sessions"
  ON public.participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Availabilities: usuarios gestionan sus propias disponibilidades
DROP POLICY IF EXISTS "users can manage own availabilities" ON public.availabilities;
CREATE POLICY "users can manage own availabilities"
  ON public.availabilities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 4. Error: Autenticación no funciona en el cliente

### Síntoma
`supabase.auth.getUser()` devuelve `null` aunque el usuario esté logueado.

### Causa
Las cookies de Supabase no se están enviando correctamente al cliente, o hay un conflicto entre `createServerClient` y `createBrowserClient`.

### Solución
- Usar `createBrowserClient` en componentes cliente (`"use client"`)
- Usar `createServerClient` solo en Server Components y Server Actions
- No mezclar ambos en el mismo flujo sin entender el contexto de ejecución
- Verificar que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén configuradas correctamente en Vercel

---

## 5. Checklist rápido de despliegue

Antes de hacer redeploy en Vercel:

- [ ] Ejecutar migraciones SQL pendientes en Supabase SQL Editor
- [ ] Recargar esquema en Supabase (Settings → API → Reload schema)
- [ ] Configurar variables de entorno en Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (si se usa)
  - `NEXT_PUBLIC_APP_URL`
  - `RESEND_API_KEY` (para emails)
- [ ] Hacer redeploy en Vercel

---

## 6. Comandos útiles

```bash
# Verificar build local
npm run build

# Ver estado de git
git status

# Ver commits recientes
git log --oneline -10

# Subir cambios
git add .
git commit -m "mensaje descriptivo"
git push origin main
```

---

## 7. Contacto

Si el problema persiste después de seguir estos pasos, revisar:
1. Los logs de Vercel (Dashboard → Deployments → Logs)
2. Los logs de Supabase (Dashboard → Logs)
3. La consola del navegador (F12 → Console)
4. La pestaña Network en las herramientas de desarrollador
