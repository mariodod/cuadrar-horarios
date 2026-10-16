-- ============================================================
-- Migración 007: Tabla de votos para coincidencias horarias
-- ============================================================
-- Ejecutar en el editor SQL de Supabase (https://app.supabase.com/project/_/sql)
-- ============================================================

-- Tabla de votos: cada usuario vota una vez por cada coincidencia
create table public.votes (
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

-- Índices para consultas rápidas
create index idx_votes_session on public.votes(session_id);
create index idx_votes_user on public.votes(user_id);
create index idx_votes_session_day on public.votes(session_id, overlap_day);

-- Row Level Security
alter table public.votes enable row level security;

-- Políticas de seguridad
create policy "participants can view votes in their sessions"
  on public.votes for select
  using (
    exists (
      select 1 from public.participants p
      where p.session_id = votes.session_id and p.user_id = auth.uid()
    )
  );

create policy "users can manage own votes"
  on public.votes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Comentarios
comment on table public.votes is 'Votos de participantes sobre coincidencias horarias (sí/no/quizás)';
comment on column public.votes.vote_type is 'Tipo de voto: yes, no o maybe';
