-- ============================================================
-- Migración 006: Agregar zona horaria a perfiles de usuario
-- ============================================================
-- Ejecutar en el editor SQL de Supabase (https://app.supabase.com/project/_/sql)
-- ============================================================

-- Agregar columna de zona horaria a la tabla profiles
alter table public.profiles
add column if not exists timezone text default 'America/Mexico_City';

-- Comentario para documentación
comment on column public.profiles.timezone is 'Zona horaria preferida del usuario (ej: America/Mexico_City, Europe/Madrid, America/New_York)';

-- Índice para búsquedas por zona horaria (opcional, para futuras consultas)
create index if not exists idx_profiles_timezone on public.profiles(timezone);
