-- ============================================================
-- Migración 004: Corregir política RLS de tabla sessions
-- ============================================================
-- Ejecutar en el editor SQL de Supabase (https://app.supabase.com/project/_/sql)
-- ============================================================

-- Eliminar la política problemática
drop policy if exists "users can create sessions" on public.sessions;

-- Política corregida: permitir insert a cualquier usuario autenticado.
-- El campo created_by se establece correctamente desde el frontend
-- con el ID del usuario autenticado.
create policy "users can create sessions"
  on public.sessions for insert
  with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------------
-- Comentario para documentación
-- ------------------------------------------------------------------
comment on policy "users can create sessions" on public.sessions is
  'Permite a cualquier usuario autenticado crear sesiones. El created_by se valida desde el frontend.';
