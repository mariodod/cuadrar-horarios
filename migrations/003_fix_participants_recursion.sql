-- ============================================================
-- Migración 003: Corregir recursión infinita en política RLS de participants
-- ============================================================
-- Ejecutar en el editor SQL de Supabase (https://app.supabase.com/project/_/sql)
-- ============================================================

-- Eliminar la política problemática que causa recursión infinita
drop policy if exists "participants can view participants of their sessions" on public.participants;

-- Política corregida: un usuario solo puede ver sus propias filas de participante
-- (no necesita consultar la misma tabla, evitando recursión)
create policy "users can view own participant records"
  on public.participants for select
  using (auth.uid() = user_id);

-- Nota: Para ver otros participantes de una sesión, la app carga los participantes
-- a través de la tabla sessions (que ya tiene su propia política RLS que verifica
-- que el usuario sea participante), por lo que esto es suficiente.

-- ------------------------------------------------------------------
-- Comentario para documentación
-- ------------------------------------------------------------------
comment on policy "users can view own participant records" on public.participants is
  'Permite a un usuario ver solo sus propios registros de participante. Evita recursión infinita en RLS.';
