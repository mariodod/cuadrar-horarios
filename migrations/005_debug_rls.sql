-- ============================================================
-- Migración 005: Debug RLS - políticas temporales permisivas
-- ============================================================
-- Ejecutar SOLO para depurar. Reemplazar con políticas restrictivas en producción.
-- ============================================================

-- ============================================================
-- 1. Verificar que las tablas existen y tienen datos
-- ============================================================
SELECT 'profiles count' as tabla, count(*) as total FROM public.profiles
UNION ALL
SELECT 'sessions count', count(*) FROM public.sessions
UNION ALL
SELECT 'participants count', count(*) FROM public.participants;

-- ============================================================
-- 2. Verificar políticas RLS actuales
-- ============================================================
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- 3. Políticas temporales PERMISIVAS para depurar
-- ============================================================

-- sessions: permitir insert a cualquier usuario autenticado
drop policy if exists "users can create sessions" on public.sessions;
create policy "debug: allow all authenticated to create sessions"
  on public.sessions for insert
  with check (auth.role() = 'authenticated');

-- sessions: permitir select a cualquier usuario autenticado
drop policy if exists "participants can view sessions they join" on public.sessions;
create policy "debug: allow all authenticated to view sessions"
  on public.sessions for select
  using (auth.role() = 'authenticated');

-- profiles: permitir insert a cualquier usuario autenticado
drop policy if exists "users can insert own profile" on public.profiles;
create policy "debug: allow all authenticated to insert profiles"
  on public.profiles for insert
  with check (auth.role() = 'authenticated');

-- profiles: permitir select a cualquier usuario autenticado
drop policy if exists "users can view own profile" on public.profiles;
create policy "debug: allow all authenticated to view profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- availabilities: permitir insert a cualquier usuario autenticado
drop policy if exists "users can manage own availabilities" on public.availabilities;
create policy "debug: allow all authenticated to manage availabilities"
  on public.availabilities for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- participants: permitir insert y select a cualquier usuario autenticado
drop policy if exists "users can view own participant records" on public.participants;
drop policy if exists "users can join sessions" on public.participants;
create policy "debug: allow all authenticated to manage participants"
  on public.participants for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 4. Comentario
-- ============================================================
comment on table public.sessions is 'DEBUG: políticas RLS permisivas temporalmente';
