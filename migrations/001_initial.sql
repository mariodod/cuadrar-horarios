-- ============================================================
-- Migración 001: Esquema inicial para Cuadrar Horarios
-- ============================================================
-- Ejecutar en el editor SQL de Supabase (https://app.supabase.com/project/_/sql)
-- ============================================================

-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------
-- Tabla de perfiles de usuario (separada de auth.users de Supabase)
-- ------------------------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------
-- Tabla de sesiones (una cuadrada de horarios entre dos personas)
-- ------------------------------------------------------------------
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  created_by uuid references public.profiles(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------
-- Participantes de una sesión
-- ------------------------------------------------------------------
create table public.participants (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(session_id, user_id)
);

-- ------------------------------------------------------------------
-- Bloques de disponibilidad por usuario y sesión
-- ------------------------------------------------------------------
create table public.availabilities (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  day date not null,           -- fecha del bloque
  start_time time not null,    -- hora de inicio
  end_time time not null,      -- hora de fin
  created_at timestamptz default now(),
  check (start_time < end_time)
);

-- ------------------------------------------------------------------
-- Índices para consultas rápidas de coincidencias
-- ------------------------------------------------------------------
create index idx_availabilities_session on public.availabilities(session_id);
create index idx_availabilities_day on public.availabilities(day);
create index idx_availabilities_user on public.availabilities(user_id);
create index idx_participants_session on public.participants(session_id);
create index idx_participants_user on public.participants(user_id);
create index idx_sessions_created_by on public.sessions(created_by);

-- ------------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.participants enable row level security;
alter table public.availabilities enable row level security;

-- ------------------------------------------------------------------
-- Políticas de seguridad (RLS)
-- ------------------------------------------------------------------

-- Profiles: cada usuario puede ver y editar su propio perfil
create policy "users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Sessions: los participantes pueden ver la sesión
create policy "participants can view sessions they join"
  on public.sessions for select
  using (
    exists (
      select 1 from public.participants p
      where p.session_id = id and p.user_id = auth.uid()
    )
  );

create policy "users can create sessions"
  on public.sessions for insert
  with check (auth.uid() = created_by);

create policy "session creator can update own session"
  on public.sessions for update
  using (auth.uid() = created_by);

-- Participants: un usuario solo ve sus propios registros de participante
-- (evita recursión infinita al no consultar la misma tabla en la política)
create policy "users can view own participant records"
  on public.participants for select
  using (auth.uid() = user_id);

create policy "users can join sessions"
  on public.participants for insert
  with check (auth.uid() = user_id);

-- Availabilities: cada usuario gestiona sus propias disponibilidades
create policy "users can view availabilities of their sessions"
  on public.availabilities for select
  using (
    exists (
      select 1 from public.participants p
      where p.session_id = availabilities.session_id and p.user_id = auth.uid()
    )
  );

create policy "users can manage own availabilities"
  on public.availabilities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- Consulta de coincidencias (overlaps) entre dos participantes
-- ------------------------------------------------------------------
-- Ejemplo de uso (reemplazar $1 por el ID de la sesión):
--
-- select
--   a1.user_id as user_1_id,
--   a2.user_id as user_2_id,
--   a1.day,
--   greatest(a1.start_time, a2.start_time) as overlap_start,
--   least(a1.end_time, a2.end_time) as overlap_end
-- from public.availabilities a1
-- join public.availabilities a2
--   on a1.session_id = a2.session_id
--   and a1.day = a2.day
--   and a1.user_id <> a2.user_id
-- where a1.session_id = $1
--   and greatest(a1.start_time, a2.start_time) < least(a1.end_time, a2.end_time)
-- order by a1.day, overlap_start;

-- ------------------------------------------------------------------
-- Comentarios en tablas para documentación
-- ------------------------------------------------------------------
comment on table public.profiles is 'Perfiles de usuario (vinculados a auth.users)';
comment on table public.sessions is 'Sesiones de cuadrado de horarios';
comment on table public.participants is 'Participantes de una sesión';
comment on table public.availabilities is 'Bloques de disponibilidad por usuario';
