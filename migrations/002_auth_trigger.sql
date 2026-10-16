-- ============================================================
-- Migración 002: Trigger para crear perfil automáticamente al registrarse
-- ============================================================
-- Ejecutar en el editor SQL de Supabase DESPUÉS de la migración 001
-- ============================================================

-- Función que se ejecuta cuando un usuario se registra en Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger que se dispara después de insertar un nuevo usuario en auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Comentario para documentación
comment on trigger on_auth_user_created on auth.users is
  'Crea automáticamente un perfil en public.profiles cuando un usuario se registra';
