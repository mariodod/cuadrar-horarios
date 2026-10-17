# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: happy-path.test.ts >> Cuadrar Horarios - Flujo completo (Happy Path) >> flujo completo: registrar, crear sesión, disponibilidad, coincidencias y votación
- Location: tests\e2e\happy-path.test.ts:30:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('Nombre completo')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "Cuadrar Horarios" [ref=e5] [cursor=pointer]:
        - /url: /
      - generic [ref=e7]:
        - link "Iniciar sesión" [ref=e8] [cursor=pointer]:
          - /url: /login
        - link "Regístrate" [active] [ref=e9] [cursor=pointer]:
          - /url: /register
  - alert [ref=e10]
  - generic [ref=e12]:
    - generic [ref=e13]:
      - heading "Crear cuenta" [level=1] [ref=e14]
      - paragraph [ref=e15]: Regístrate para gestionar tus cuadrados de horarios.
    - generic [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]: Nombre completo
        - textbox "Juan Pérez" [ref=e19]
      - generic [ref=e20]:
        - generic [ref=e21]: Correo electrónico
        - textbox "tu@correo.com" [ref=e22]
      - generic [ref=e23]:
        - generic [ref=e24]: Contraseña
        - textbox "••••••••" [ref=e25]
      - button "Crear cuenta" [ref=e26] [cursor=pointer]
    - paragraph [ref=e27]:
      - text: ¿Ya tienes cuenta?
      - link "Inicia sesión" [ref=e28] [cursor=pointer]:
        - /url: /login
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * Prueba End-to-End: Flujo completo "Happy Path" de Cuadrar Horarios
  5   |  *
  6   |  * Este test verifica el flujo completo de la aplicación:
  7   |  * 1. Usuario se registra
  8   |  * 2. Crea una nueva sesión
  9   |  * 3. Registra su disponibilidad
  10  |  * 4. Ve las coincidencias
  11  |  * 5. Vota en una coincidencia
  12  |  * 6. Ver el resultado del voto
  13  |  *
  14  |  * Requisitos previos:
  15  |  * - Tener una instancia de Supabase corriendo (local o en la nube)
  16  |  * - Variables de entorno: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
  17  |  * - PLAYWRIGHT_BASE_URL apuntando a la aplicación (localhost o desplegada)
  18  |  */
  19  | 
  20  | test.describe("Cuadrar Horarios - Flujo completo (Happy Path)", () => {
  21  |   // Datos de prueba para el usuario
  22  |   const testUser = {
  23  |     email: `test-${Date.now()}@example.com`,
  24  |     password: "TestPassword123!",
  25  |     name: "Usuario Prueba",
  26  |   };
  27  | 
  28  |   const sessionTitle = "Reunión de prueba E2E";
  29  | 
  30  |   test("flujo completo: registrar, crear sesión, disponibilidad, coincidencias y votación", async ({
  31  |     page,
  32  |   }) => {
  33  |     // ==========================================
  34  |     // PASO 1: Ir a la página de inicio
  35  |     // ==========================================
  36  |     await test.step("Navegar a la página de inicio", async () => {
  37  |       await page.goto("/");
  38  |       await expect(page).toHaveTitle(/Cuadrar Horarios/);
  39  |       await expect(
  40  |         page.getByRole("heading", { name: "Cuadrar Horarios" })
  41  |       ).toBeVisible();
  42  |     });
  43  | 
  44  |     // ==========================================
  45  |     // PASO 2: Ir a registro y crear cuenta
  46  |     // ==========================================
  47  |     await test.step("Registrar nuevo usuario", async () => {
  48  |       await page.getByRole("link", { name: "Regístrate" }).click();
  49  |       await expect(page).toHaveURL("/register");
  50  |       await expect(
  51  |         page.getByRole("heading", { name: "Crear cuenta" })
  52  |       ).toBeVisible();
  53  | 
> 54  |       await page.getByLabel("Nombre completo").fill(testUser.name);
      |                                                ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  55  |       await page.getByLabel("Correo electrónico").fill(testUser.email);
  56  |       await page.getByLabel("Contraseña").fill(testUser.password);
  57  | 
  58  |       await page.getByRole("button", { name: "Crear cuenta" }).click();
  59  | 
  60  |       // Debería redirigir a crear sesión después del registro
  61  |       await expect(page).toHaveURL("/session/new");
  62  |     });
  63  | 
  64  |     // ==========================================
  65  |     // PASO 3: Crear una nueva sesión
  66  |     // ==========================================
  67  |     await test.step("Crear nueva sesión de cuadrada", async () => {
  68  |       await expect(page).toHaveURL("/session/new");
  69  |       await expect(
  70  |         page.getByRole("heading", { name: "Nueva cuadrada" })
  71  |       ).toBeVisible();
  72  | 
  73  |       await page.getByLabel("Título de la sesión").fill(sessionTitle);
  74  | 
  75  |       await page.getByRole("button", { name: "Crear sesión" }).click();
  76  | 
  77  |       // Debería redirigir a la página de la sesión creada
  78  |       await expect(page).toMatchURL(/\/session\//);
  79  |       await expect(
  80  |         page.getByRole("heading", { name: sessionTitle })
  81  |       ).toBeVisible();
  82  |     });
  83  | 
  84  |     // Guardar el ID de la sesión de la URL para verificar después
  85  |     const sessionUrl = page.url();
  86  |     const sessionId = sessionUrl.split("/").pop();
  87  |     test.info().attach("session-id", {
  88  |       body: sessionId || "desconocido",
  89  |       contentType: "text/plain",
  90  |     });
  91  | 
  92  |     // ==========================================
  93  |     // PASO 4: Registrar disponibilidad
  94  |     // ==========================================
  95  |     await test.step("Registrar disponibilidad en la sesión", async () => {
  96  |       await page.getByRole("link", { name: "Registrar mi disponibilidad" }).click();
  97  |       await expect(page).toHaveURL(`/session/${sessionId}/availability`);
  98  |       await expect(
  99  |         page.getByRole("heading", { name: "Tu disponibilidad" })
  100 |       ).toBeVisible();
  101 | 
  102 |       // Seleccionar una fecha futura (mañana)
  103 |       const tomorrow = new Date();
  104 |       tomorrow.setDate(tomorrow.getDate() + 1);
  105 |       const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD
  106 | 
  107 |       await page.getByLabel("Día").fill(tomorrowStr);
  108 |       await page.getByLabel("Hora de inicio").fill("10:00");
  109 |       await page.getByLabel("Hora de fin").fill("12:00");
  110 | 
  111 |       await page.getByRole("button", { name: "Guardar disponibilidad" }).click();
  112 | 
  113 |       // Debería mostrar mensaje de éxito
  114 |       await expect(
  115 |         page.getByText("Disponibilidad guardada")
  116 |       ).toBeVisible();
  117 |     });
  118 | 
  119 |     // ==========================================
  120 |     // PASO 5: Ver la sesión y coincidencias
  121 |     // ==========================================
  122 |     await test.step("Ver coincidencias en la sesión", async () => {
  123 |       await page.getByRole("link", { name: "Ver coincidencias" }).click();
  124 |       await expect(page).toHaveURL(`/session/${sessionId}`);
  125 |       await expect(page.getByRole("heading", { name: sessionTitle })).toBeVisible();
  126 | 
  127 |       // Debería mostrar la sección de disponibilidad registrada
  128 |       await expect(
  129 |         page.getByRole("heading", { name: "Disponibilidad registrada" })
  130 |       ).toBeVisible();
  131 | 
  132 |       // Debería mostrar el bloque de disponibilidad que acabamos de crear
  133 |       await expect(page.getByText(tomorrowStr.split("-").reverse().join("-"))).toBeVisible(); // Formato DD/MM/YYYY o similar
  134 |       await expect(page.getByText("10:00 – 12:00")).toBeVisible();
  135 |     });
  136 | 
  137 |     // ==========================================
  138 |     // PASO 6: Votar en una coincidencia
  139 |     // ==========================================
  140 |     await test.step("Votar en una coincidencia", async () => {
  141 |       // Si hay coincidencias mostradas, votar "Sí"
  142 |       const voteButton = page.getByRole("button", { name: /✓ Sí/ });
  143 |       if ((await voteButton.count()) > 0) {
  144 |         await voteButton.first().click();
  145 |         await expect(
  146 |           page.getByRole("button", { name: /✓ Sí/ }).first()
  147 |         ).toHaveClass(/bg-green-100/);
  148 |       } else {
  149 |         // Si no hay coincidencias (porque solo hay un usuario), al menos verificar
  150 |         // que la sección de coincidencias se renderiza
  151 |         await expect(
  152 |           page.getByRole("heading", { name: "Horas en las que coinciden" })
  153 |         ).toBeVisible();
  154 |       }
```