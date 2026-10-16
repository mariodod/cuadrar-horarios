# Plan Completo: Cuadrar Horarios

Aplicación web donde dos personas indican sus horarios disponibles y el programa muestra las horas en las que coinciden.

---

## 1. Visión general

**Nombre del proyecto:** Cuadrar Horarios  
**Propósito:** Permitir que dos personas registren sus bloques de disponibilidad y visualicen automáticamente los rangos horarios donde ambos están libres al mismo tiempo.  
**Idioma del proyecto:** Español (UI, documentación y mensajes).  
**Estado:** Planificación (pre-desarrollo).

---

## 2. Objetivos y alcance

### MVP (Producto Mínimo Viable)
- Crear una sesión de cuadrado de horarios y obtener un link compartible.
- Dos participantes se unen a la misma sesión.
- Cada participante registra uno o más bloques de disponibilidad (día + hora de inicio + hora de fin).
- El sistema calcula y muestra las intersecciones horarias entre los dos participantes.
- Autenticación básica con email para guardar sesiones (opcional pero recomendado).

### Post-MVP (futuro)
- Más de dos participantes por sesión.
- Votación sobre las mejores opciones horarias.
- Exportar coincidencias a calendario (Google Calendar, Outlook, .ics).
- Notificaciones por email cuando coincidan horarios.
- Temas claro/oscuro.

---

## 3. Stack tecnológico

Elegido para ser fácil de desarrollar, mantener y desplegar, con el mínimo de código boilerplate.

| Capa | Tecnología | Versión / nota | Por qué |
|------|-----------|----------------|---------|
| Framework | Next.js | 14+ (App Router) | Fullstack en un solo proyecto, rutas de API integradas, despliegue en un clic |
| Lenguaje | TypeScript | 5+ | Tipado estático, menos errores en tiempo de ejecución |
| Estilos | Tailwind CSS | 3+ | UI rápida sin escribir CSS a mano |
| Componentes | shadcn/ui | Última | Componentes copiar-pegar, accesibles y fáciles de personalizar |
| Iconos | Lucide React | Última | Iconografía ligera y consistente |
| Base de datos | Supabase (PostgreSQL) | Managed | Backend listo en minutos, tablas, RLS y sin servidor propio |
| Autenticación | Supabase Auth | Email/password | Listo para usar, sesiones seguras |
| Fechas | date-fns | Última | Comparación y cruce de horarios sencillo y fiable |
| Validación | Zod | Última | Esquemas de validación para formularios de disponibilidad |
| Despliegue | Vercel | Conectado a Git | Despliegue automático por push |
| Gestión de estado | React Hook Form + Zod | Última | Formularios de disponibilidad fáciles de manejar |
| Despliegue de DB | Supabase CLI / Migraciones SQL | — | Versionado de esquema de base de datos |

---

## 4. Arquitectura del sistema

```
Cliente (Next.js + React)
        │
        ▼
  Supabase Client (SDK JS)
        │
        ├───────────────┐
        ▼               ▼
  Supabase Auth   Supabase PostgreSQL
  (sesiones)      (tablas + RLS)
```

- **Frontend:** Next.js renderiza páginas del servidor y componentes de cliente para la interactividad (selección de horarios, vista de coincidencias).
- **Backend:** Rutas de API de Next.js solo se usan si se necesita lógica adicional; la mayoría de operaciones CRUD van directamente a Supabase con RLS (Row Level Security).
- **Base de datos:** PostgreSQL gestionado por Supabase. Las tablas están protegidas con políticas de seguridad por fila para que un usuario solo lea/escriba sus propias disponibilidades y sesiones.

---

## 5. Modelo de datos (SQL)

Se ejecuta en el editor SQL de Supabase.

```sql
-- Habilitar extensión uuid
create extension if not exists "uuid-ossp";

-- Tabla de usuarios (perfiles, separados de auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Tabla de sesiones (una cuadrada entre dos personas)
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  created_by uuid references public.profiles(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Participantes de una sesión
create table public.participants (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(session_id, user_id)
);

-- Bloques de disponibilidad por usuario y sesión
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

-- Índices para consultas rápidas de coincidencias
create index idx_availabilities_session on public.availabilities(session_id);
create index idx_availabilities_day on public.availabilities(day);
create index idx_participants_session on public.participants(session_id);

-- RLS: Row Level Security
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.participants enable row level security;
alter table public.availabilities enable row level security;

-- Políticas de ejemplo (ajustar según necesidades)
create policy "users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "users can view sessions they participate in" on public.sessions
  for select using (
    exists (select 1 from public.participants p where p.session_id = id and p.user_id = auth.uid())
  );

create policy "users can manage own availabilities" on public.availabilities
  for all using (auth.uid() = user_id);
```

### Consulta de coincidencias (overlaps)

Dada una sesión con dos participantes, el cruce se calcula así:

```sql
select
  a1.user_id as user_1_id,
  a2.user_id as user_2_id,
  a1.day,
  greatest(a1.start_time, a2.start_time) as overlap_start,
  least(a1.end_time, a2.end_time) as overlap_end
from public.availabilities a1
join public.availabilities a2
  on a1.session_id = a2.session_id
  and a1.day = a2.day
  and a1.user_id <> a2.user_id
where a1.session_id = $1
  and greatest(a1.start_time, a2.start_time) < least(a1.end_time, a2.end_time)
order by a1.day, overlap_start;
```

---

## 6. Endpoints de API (Next.js App Router)

Si se necesita lógica adicional más allá de Supabase directo:

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/sessions` | Crear nueva sesión |
| GET | `/api/session/[id]` | Obtener datos de una sesión y sus participantes |
| POST | `/api/session/[id]/join` | Unirse como participante a una sesión |
| POST | `/api/availabilities` | Guardar bloques de disponibilidad |
| GET | `/api/session/[id]/overlaps` | Devolver coincidencias horarias |
| POST | `/api/auth/...` | Manejo de autenticación (delegado a Supabase) |

---

## 7. Flujo de usuario (MVP)

1. **Landing:** Usuario llega a la página principal. Opción: "Crear nueva cuadrada" o "Ingresar a sesión existente".
2. **Crear sesión:** Usuario A se autentica (o entra como invitado), crea una sesión y recibe un link único (ej. `/session/abc123`).
3. **Invitación:** Usuario A envía el link a Usuario B.
4. **Unirse:** Usuario B abre el link y se une a la sesión como segundo participante.
5. **Registrar disponibilidad:** Cada usuario marca sus bloques libres (día, hora inicio, hora fin). Puede agregar varios bloques.
6. **Ver coincidencias:** Una vez ambos han registrado disponibilidad, la app muestra una tabla/grid con los rangos horarios donde coinciden (ej. "Lunes 10:00 – 12:00", "Miércoles 15:00 – 17:00").
7. **Seleccionar:** Los usuarios acuerdan una de las horas mostradas.

---

## 8. Estructura de carpetas

```
cuadrar-horarios/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── route.ts
│   ├── session/
│   │   ├── [id]/
│   │   │   ├── page.tsx          # ver sesión, disponibilidades y coincidencias
│   │   │   └── availability/
│   │   │       └── page.tsx      # formulario para agregar disponibilidad
│   │   └── new/
│   │       └── page.tsx          # crear nueva sesión
│   ├── api/
│   │   ├── sessions/
│   │   │   └── route.ts
│   │   ├── availabilities/
│   │   │   └── route.ts
│   │   └── overlaps/
│   │       └── route.ts
│   └── page.tsx                  # landing
├── components/
│   ├── ui/                       # shadcn/ui (button, input, dialog, etc.)
│   ├── availability-form.tsx
│   ├── availability-list.tsx
│   ├── overlap-grid.tsx          # tabla de coincidencias
│   ├── session-card.tsx
│   └── provider.tsx              # Supabase provider
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # cliente de Supabase (browser)
│   │   ├── server.ts             # cliente de Supabase (server)
│   │   └── middleware.ts         # auth middleware
│   ├── utils.ts                  # helpers generales (clsx, etc.)
│   ├── date-utils.ts             # helpers con date-fns para cruce de horarios
│   └── validations.ts            # esquemas Zod
├── migrations/
│   └── 001_initial.sql           # esquema de base de datos
├── public/
│   └── icons/
├── .env.local.example
├── .env.local
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── PLAN.md
└── README.md
```

---

## 9. Variables de entorno

Archivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Archivo `.env.local.example` para el repositorio (sin valores reales).

---

## 10. Pasos de instalación y desarrollo

```bash
# 1. Crear el proyecto Next.js
npx create-next-app@latest cuadrar-horarios --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*"

# 2. Entrar a la carpeta
cd cuadrar-horarios

# 3. Instalar dependencias
npm install @supabase/supabase-js @supabase/ssr date-fns zod lucide-react react-hook-form @hookform/resolvers

# 4. Inicializar shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input dialog form

# 5. Configurar variables de entorno
cp .env.local.example .env.local
# editar .env.local con las claves de Supabase

# 6. Ejecutar migraciones en Supabase
# (copiar y pegar el SQL de la sección 5 en el editor SQL de Supabase)

# 7. Ejecutar en desarrollo
npm run dev

# 8. Desplegar en Vercel
# Conectar repositorio de GitHub a Vercel y agregar variables de entorno
```

---

## 11. Hitos y cronograma sugerido

| Hito | Tareas | Tiempo estimado |
|------|--------|-----------------|
| 1. Setup | Next.js, Tailwind, shadcn/ui, Supabase, variables de entorno | 1 día |
| 2. Modelo de datos | Tablas SQL, RLS, migraciones | 0.5 días |
| 3. Autenticación | Login con Supabase Auth, perfiles de usuario | 1 día |
| 4. Sesiones | Crear sesión, link compartible, unirse como participante | 1 día |
| 5. Disponibilidad | Formulario para registrar bloques, guardar en BD | 1 día |
| 6. Coincidencias | Consulta de overlaps, vista de resultados | 1 día |
| 7. Despliegue | Vercel, dominio, variables de entorno | 0.5 días |
| **Total** | | **~6 días** |

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Diferencias de zona horaria | Almacenar todo en UTC o usar fechas locales consistentes; avisar al usuario de la zona horaria usada |
| Dos usuarios escriben al mismo tiempo | Usar transacciones o actualizaciones atómicas en Supabase |
| Seguridad de datos | RLS habilitado en todas las tablas; usuarios solo acceden a sus propias filas |
| Escalabilidad de más de 2 usuarios | La consulta de overlaps se puede generalizar con self-joins adicionales |

---

## 13. Comandos clave de Git

```bash
git init
git add .
git commit -m "chore: plan completo del proyecto cuadrar-horarios"
git branch -M main
git remote add origin https://github.com/usuario/cuadrar-horarios.git
git push -u origin main
```

---

## 14. Criterios de aceptación (MVP)

- [ ] Un usuario puede crear una sesión y obtener un link.
- [ ] Un segundo usuario puede unirse a esa sesión mediante el link.
- [ ] Cada usuario puede registrar al menos un bloque de disponibilidad (día + hora inicio + hora fin).
- [ ] La aplicación muestra las horas donde ambos usuarios coinciden.
- [ ] Los datos persisten en Supabase tras recargar la página.
- [ ] El despliegue en Vercel funciona y es accesible por URL pública.
