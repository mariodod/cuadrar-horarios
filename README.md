# 🕒 Cuadrar Horarios

> Aplicación web para cuadrar horarios entre dos o más personas. Encuentra automáticamente las horas en las que coinciden todos los participantes y vota las mejores opciones.

[![GitHub](https://img.shields.io/badge/GitHub-cuadrar--horarios-blue?logo=github)](https://github.com/mariodod/cuadrar-horarios)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel)](https://vercel.com/)

---

## 📖 Tabla de Contenidos

1. [Descripción](#descripción)
2. ✨ Funcionalidades
3. 🚀 Comenzando (Instalación y Despliegue)
4. 📘 Tutorial para Usuarios
5. 🛠️ Stack Tecnológico
6. 🗄️ Base de Datos
7. 🧪 Pruebas
8. 📝 Contribución
9. 📄 Licencia

---

## 📝 Descripción

**Cuadrar Horarios** es una aplicación web diseñada para facilitar la coordinación de horarios entre dos o más personas. Ya sea para organizar una cita, una reunión de trabajo, una cena con amigos o cualquier evento grupal, la aplicación permite que cada participante registre sus bloques de disponibilidad y automáticamente muestra las horas en las que todos coinciden.

Además, los participantes pueden votar las opciones que más les gustan, lo que facilita la toma de decisiones grupales.

---

## ✨ Funcionalidades

### 🔐 Autenticación y Perfiles
- **Registro de usuario** con nombre, correo electrónico y contraseña
- **Inicio de sesión** seguro con Supabase Auth
- **Cierre de sesión** desde cualquier página
- **Perfil de usuario** con nombre, correo y zona horaria
- **Lista de sesiones creadas** por el usuario en su perfil

### 📅 Gestión de Sesiones
- **Crear sesión** con título personalizado
- **Invitar a otros participantes** por correo electrónico (envía invitación automática)
- **Obtener link compartible** para invitar a personas por cualquier medio
- **Unirse a sesión existente** mediante enlace compartido
- **Ver participantes** de cada sesión y quién es el creador

### 🕐 Disponibilidad y Coincidencias
- **Registrar disponibilidad** seleccionando día, hora de inicio y hora de fin
- **Múltiples bloques** de disponibilidad por usuario
- **Editar bloques existentes** (cambiar día u horas)
- **Eliminar bloques** que ya no sean necesarios
- **Ver automáticamente las horas en las que coinciden** todos los participantes
- **Ver disponibilidad individual** de cada participante por día

### 🗳️ Votación
- **Votar "Sí"**, **"Quizás"** o **"No"** en cada coincidencia horaria
- **Ver porcentaje de votos** positivos por cada opción
- **Cambiar voto** en cualquier momento
- **Ver resumen total** de votos por categoría

### 📅 Exportación a Calendario
- **Descargar archivo .ics** compatible con Google Calendar, Outlook, Apple Calendar, etc.
- **Enlace directo a Google Calendar** con el evento prellenado

### 🌍 Zona Horaria
- **Seleccionar zona horaria personal** desde el perfil
- **Todas las horas se muestran** en la zona horaria del usuario

### 📧 Notificaciones por Email
- **Email de bienvenida** al crear una sesión
- **Invitación por email** a nuevos participantes
- **Notificación cuando otro participante registra disponibilidad**

---

## 🚀 Comenzando

### Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 20 o superior)
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
- Una cuenta en [Supabase](https://supabase.com/)
- Una cuenta en [Vercel](https://vercel.com/) (para despliegue)
- Una cuenta en [Resend](https://resend.com/) (opcional, para notificaciones por email)

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/mariodod/cuadrar-horarios.git
cd cuadrar-horarios

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
```

### Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con lo siguiente:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Resend (opcional, para notificaciones por email)
RESEND_API_KEY=re_tu-api-key-de-resend

# URL de la aplicación (para enlaces en emails)
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

### Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Desplegar en Vercel

1. Sube el código a un repositorio de GitHub
2. Conecta el repositorio a [Vercel](https://vercel.com/)
3. Agrega las variables de entorno en la configuración de Vercel
4. Haz clic en "Deploy"

---

## 📘 Tutorial para Usuarios

Esta guía te muestra paso a paso cómo usar la aplicación.

### Paso 1: Crear una Cuenta

1. Ve a la página principal de la aplicación
2. Haz clic en **"Regístrate"**
3. Ingresa tu **nombre completo**, **correo electrónico** y **contraseña**
4. Haz clic en **"Crear cuenta"**
5. Serás redirigido automáticamente a crear tu primera sesión

### Paso 2: Configurar Tu Zona Horaria (Opcional pero Recomendado)

1. Haz clic en **"Perfil"** en la barra de navegación superior
2. Selecciona tu zona horaria de la lista desplegable
3. Haz clic en **"Guardar zona horaria"**

Esto asegura que todas las horas se muestren correctamente según tu ubicación.

### Paso 3: Crear una Nueva Sesión (Cuadrada)

1. Desde la página de inicio o después de registrarte, haz clic en **"Crear nueva cuadrada"**
2. Ingresa un **título** para tu sesión (ejemplo: "Cena con amigos", "Reunión de proyecto", "Cita médica")
3. Opcionalmente, ingresa el **correo electrónico** de una persona para invitarla por email
4. Haz clic en **"Crear sesión"**
5. Se generará un enlace único que puedes compartir con otras personas

### Paso 4: Unirte a una Sesión Existente

Si alguien te envió un enlace de invitación:

1. Abre el enlace que te enviaron
2. Si no tienes cuenta, se te pedirá registrarte primero
3. Una vez autenticado, se te agregará como participante de la sesión
4. Podrás registrar tu disponibilidad y votar

### Paso 5: Registrar Tu Disponibilidad

1. En la página de la sesión, haz clic en **"Registrar mi disponibilidad"**
2. Selecciona el **día** en el que estás disponible
3. Selecciona la **hora de inicio** y la **hora de fin**
4. Haz clic en **"Guardar disponibilidad"**
5. Puedes agregar tantos bloques de disponibilidad como quieras en diferentes días

Para editar o eliminar un bloque existente:
- Haz clic en **"Editar"** para modificar el día u horas
- Haz clic en **"Eliminar"** para borrar el bloque

### Paso 6: Ver las Coincidencias

Una vez que todos los participantes hayan registrado su disponibilidad:

1. En la página de la sesión, verás la sección **"Horas en las que coinciden"**
2. Se mostrarán los días y horarios donde todos están disponibles al mismo tiempo
3. Cada coincidencia muestra la hora de inicio y fin

### Paso 7: Votar las Mejores Opciones

Para cada coincidencia mostrada, puedes votar:

| Botón | Significado |
|-------|-------------|
| ✓ **Sí** | Esta hora me funciona perfectamente |
| ~ **Quizás** | Podría funcionar, pero no es mi primera opción |
| ✗ **No** | Esta hora no me funciona |

El sistema muestra el porcentaje de votos "Sí" para cada opción, ayudando al grupo a decidir rápidamente.

### Paso 8: Exportar a Calendario

Cuando hayan acordado una hora:

1. Haz clic en **"Descargar .ics"** para descargar un archivo de calendario
2. O haz clic en **"Google Calendar"** para agregar directamente a Google Calendar
3. El evento incluirá el título de la sesión, fecha, hora y un enlace a la sesión

### Paso 9: Ver Tus Sesiones Creadas

En cualquier momento puedes:

1. Hacer clic en **"Perfil"** en la barra de navegación
2. Ver tu zona horaria configurada
3. Ver la lista de **todas las sesiones que has creado**
4. Hacer clic en cualquier sesión para volver a ella

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Next.js | 14.2.5 |
| **Lenguaje** | TypeScript | 5.x |
| **Estilos** | Tailwind CSS | 3.4.x |
| **Componentes UI** | shadcn/ui | - |
| **Formularios** | React Hook Form | 7.52.x |
| **Validación** | Zod | 3.23.x |
| **Base de Datos** | Supabase (PostgreSQL) | - |
| **Autenticación** | Supabase Auth | - |
| **Email** | Supabase + Resend | - |
| **Despliegue** | Vercel | - |
| **Pruebas Unitarias** | Jest + React Testing Library | - |
| **Pruebas E2E** | Playwright | - |
| **Iconos** | Lucide React | - |

---

## 🗄️ Base de Datos

El proyecto utiliza PostgreSQL a través de Supabase con las siguientes tablas principales:

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfiles de usuario (nombre, email, zona horaria) |
| `sessions` | Sesiones de cuadrado de horarios |
| `participants` | Participantes de cada sesión |
| `availabilities` | Bloques de disponibilidad por usuario |
| `availabilities_overlaps` | Coincidencias horarias calculadas |
| `votes` | Votos de participantes (sí/no/quizás) |

Todas las tablas tienen **Row Level Security (RLS)** habilitado para garantizar que los usuarios solo accedan a sus propios datos.

---

## 🧪 Pruebas

### Pruebas Unitarias (Jest)

```bash
# Ejecutar en modo observación
npm run test

# Ejecutar una vez (CI)
npm run test:ci

# Ejecutar con cobertura
npm run test:coverage
```

Incluye pruebas para:
- Componentes de UI (Button, CopyLinkButton)
- Lógica de cálculo de solapamientos horarios

### Pruebas End-to-End (Playwright)

```bash
# Ejecutar pruebas E2E
npm run test:e2e

# Ejecutar con interfaz gráfica
npm run test:e2e:ui

# Ejecutar en CI
npm run test:e2e:ci
```

Incluye pruebas para:
- Flujo completo de registro, creación de sesión y disponibilidad
- Login con credenciales inválidas
- Navegación al perfil y ver sesiones

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Para contribuir:

1. Haz un fork del repositorio
2. Crea una rama con tu funcionalidad: `git checkout -b feature/nueva-funcionalidad`
3. Haz commit de tus cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Sube tu rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

## 📞 Soporte

Si tienes problemas o sugerencias:

- Abre un **Issue** en GitHub: https://github.com/mariodod/cuadrar-horarios/issues
- Revisa la documentación de solución de problemas: `TROUBLESHOOTING.md`

---

## 📅 Historial de Versiones

| Versión | Fecha | Cambios Principales |
|---------|-------|---------------------|
| v1.0.0 | 2026-10-16 | Lanzamiento inicial: autenticación, sesiones, disponibilidad, coincidencias, votación, exportación a calendario, zona horaria, notificaciones por email, tests unitarios y E2E |

---

<center>
Hecho con ❤️ por Mario Dod
</center>
