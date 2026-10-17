# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: happy-path.test.ts >> Cuadrar Horarios - Flujo completo (Happy Path) >> flujo alternativo: login con usuario existente
- Location: tests\e2e\happy-path.test.ts:172:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('Correo electrónico')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "Cuadrar Horarios" [ref=e5] [cursor=pointer]:
        - /url: /
      - generic [ref=e7]:
        - link "Iniciar sesión" [ref=e8] [cursor=pointer]:
          - /url: /login
        - link "Regístrate" [ref=e9] [cursor=pointer]:
          - /url: /register
  - generic [ref=e11]:
    - generic [ref=e12]:
      - heading "Iniciar sesión" [level=1] [ref=e13]
      - paragraph [ref=e14]: Accede a tu cuenta para gestionar tus cuadrados de horarios.
    - generic [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]: Correo electrónico
        - textbox "tu@correo.com" [ref=e18]
      - generic [ref=e19]:
        - generic [ref=e20]: Contraseña
        - textbox "••••••••" [ref=e21]
      - button "Iniciar sesión" [ref=e22] [cursor=pointer]
    - paragraph [ref=e23]:
      - text: ¿No tienes cuenta?
      - link "Regístrate como nuevo usuario" [ref=e24] [cursor=pointer]:
        - /url: /register
  - alert [ref=e25]
```

# Test source

```ts
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
  155 |     });
  156 | 
  157 |     // ==========================================
  158 |     // PASO 7: Verificar que el voto se guardó (recargar)
  159 |     // ==========================================
  160 |     await test.step("Verificar que el voto persiste al recargar", async () => {
  161 |       await page.reload();
  162 |       await expect(page.getByRole("heading", { name: sessionTitle })).toBeVisible();
  163 | 
  164 |       // El voto debería seguir marcado como "Sí"
  165 |       const yesButton = page.getByRole("button", { name: /✓ Sí/ }).first();
  166 |       if ((await yesButton.count()) > 0) {
  167 |         await expect(yesButton).toHaveClass(/bg-green-100/);
  168 |       }
  169 |     });
  170 |   });
  171 | 
  172 |   test("flujo alternativo: login con usuario existente", async ({
  173 |     page,
  174 |   }) => {
  175 |     await test.step("Ir a página de login", async () => {
  176 |       await page.goto("/login");
  177 |       await expect(page).toHaveURL("/login");
  178 |       await expect(
  179 |         page.getByRole("heading", { name: "Iniciar sesión" })
  180 |       ).toBeVisible();
  181 |     });
  182 | 
  183 |     await test.step("Intentar login con credenciales inválidas", async () => {
> 184 |       await page.getByLabel("Correo electrónico").fill("usuario-inexistente@example.com");
      |                                                   ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  185 |       await page.getByLabel("Contraseña").fill("contraseña-incorrecta");
  186 |       await page.getByRole("button", { name: "Iniciar sesión" }).click();
  187 | 
  188 |       // Debería mostrar error de autenticación
  189 |       await expect(page.getByText(/credenciales|inválidas|error/i)).toBeVisible();
  190 |     });
  191 |   });
  192 | 
  193 |   test("flujo alternativo: navegar al perfil y ver sesiones creadas", async ({
  194 |     page,
  195 |   }) => {
  196 |     await test.step("Registrar y verificar perfil", async () => {
  197 |       await page.goto("/register");
  198 |       await page.getByLabel("Nombre completo").fill("Usuario Perfil Test");
  199 |       await page.getByLabel("Correo electrónico").fill(`perfil-${Date.now()}@example.com`);
  200 |       await page.getByLabel("Contraseña").fill("TestPassword123!");
  201 |       await page.getByRole("button", { name: "Crear cuenta" }).click();
  202 |       await expect(page).toHaveURL("/session/new");
  203 |     });
  204 | 
  205 |     await test.step("Ir al perfil y verificar sesiones", async () => {
  206 |       await page.getByRole("link", { name: "Perfil" }).click();
  207 |       await expect(page).toHaveURL("/profile");
  208 |       await expect(
  209 |         page.getByRole("heading", { name: "Configuración de perfil" })
  210 |       ).toBeVisible();
  211 |       await expect(
  212 |         page.getByRole("heading", { name: /Tus sesiones/ })
  213 |       ).toBeVisible();
  214 |     });
  215 |   });
  216 | });
  217 | 
```