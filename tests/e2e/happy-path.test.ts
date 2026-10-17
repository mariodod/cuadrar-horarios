import { test, expect } from "@playwright/test";

/**
 * Prueba End-to-End: Flujo completo "Happy Path" de Cuadrar Horarios
 *
 * Este test verifica el flujo completo de la aplicación:
 * 1. Usuario se registra
 * 2. Crea una nueva sesión
 * 3. Registra su disponibilidad
 * 4. Ve las coincidencias
 * 5. Vota en una coincidencia
 * 6. Ver el resultado del voto
 *
 * Requisitos previos:
 * - Tener una instancia de Supabase corriendo (local o en la nube)
 * - Variables de entorno: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - PLAYWRIGHT_BASE_URL apuntando a la aplicación (localhost o desplegada)
 */

test.describe("Cuadrar Horarios - Flujo completo (Happy Path)", () => {
  // Datos de prueba para el usuario
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123!",
    name: "Usuario Prueba",
  };

  const sessionTitle = "Reunión de prueba E2E";

  test("flujo completo: registrar, crear sesión, disponibilidad, coincidencias y votación", async ({
    page,
  }) => {
    // ==========================================
    // PASO 1: Ir a la página de inicio
    // ==========================================
    await test.step("Navegar a la página de inicio", async () => {
      await page.goto("/");
      await expect(page).toHaveTitle(/Cuadrar Horarios/);
      await expect(
        page.getByRole("heading", { name: "Cuadrar Horarios" })
      ).toBeVisible();
    });

    // ==========================================
    // PASO 2: Ir a registro y crear cuenta
    // ==========================================
    await test.step("Registrar nuevo usuario", async () => {
      await page.getByRole("link", { name: "Regístrate" }).click();
      await expect(page).toHaveURL("/register");
      await expect(
        page.getByRole("heading", { name: "Crear cuenta" })
      ).toBeVisible();

      await page.getByLabel("Nombre completo").fill(testUser.name);
      await page.getByLabel("Correo electrónico").fill(testUser.email);
      await page.getByLabel("Contraseña").fill(testUser.password);

      await page.getByRole("button", { name: "Crear cuenta" }).click();

      // Debería redirigir a crear sesión después del registro
      await expect(page).toHaveURL("/session/new");
    });

    // ==========================================
    // PASO 3: Crear una nueva sesión
    // ==========================================
    await test.step("Crear nueva sesión de cuadrada", async () => {
      await expect(page).toHaveURL("/session/new");
      await expect(
        page.getByRole("heading", { name: "Nueva cuadrada" })
      ).toBeVisible();

      await page.getByLabel("Título de la sesión").fill(sessionTitle);

      await page.getByRole("button", { name: "Crear sesión" }).click();

      // Debería redirigir a la página de la sesión creada
      await expect(page).toMatchURL(/\/session\//);
      await expect(
        page.getByRole("heading", { name: sessionTitle })
      ).toBeVisible();
    });

    // Guardar el ID de la sesión de la URL para verificar después
    const sessionUrl = page.url();
    const sessionId = sessionUrl.split("/").pop();
    test.info().attach("session-id", {
      body: sessionId || "desconocido",
      contentType: "text/plain",
    });

    // ==========================================
    // PASO 4: Registrar disponibilidad
    // ==========================================
    await test.step("Registrar disponibilidad en la sesión", async () => {
      await page.getByRole("link", { name: "Registrar mi disponibilidad" }).click();
      await expect(page).toHaveURL(`/session/${sessionId}/availability`);
      await expect(
        page.getByRole("heading", { name: "Tu disponibilidad" })
      ).toBeVisible();

      // Seleccionar una fecha futura (mañana)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

      await page.getByLabel("Día").fill(tomorrowStr);
      await page.getByLabel("Hora de inicio").fill("10:00");
      await page.getByLabel("Hora de fin").fill("12:00");

      await page.getByRole("button", { name: "Guardar disponibilidad" }).click();

      // Debería mostrar mensaje de éxito
      await expect(
        page.getByText("Disponibilidad guardada")
      ).toBeVisible();
    });

    // ==========================================
    // PASO 5: Ver la sesión y coincidencias
    // ==========================================
    await test.step("Ver coincidencias en la sesión", async () => {
      await page.getByRole("link", { name: "Ver coincidencias" }).click();
      await expect(page).toHaveURL(`/session/${sessionId}`);
      await expect(page.getByRole("heading", { name: sessionTitle })).toBeVisible();

      // Debería mostrar la sección de disponibilidad registrada
      await expect(
        page.getByRole("heading", { name: "Disponibilidad registrada" })
      ).toBeVisible();

      // Debería mostrar el bloque de disponibilidad que acabamos de crear
      await expect(page.getByText(tomorrowStr.split("-").reverse().join("-"))).toBeVisible(); // Formato DD/MM/YYYY o similar
      await expect(page.getByText("10:00 – 12:00")).toBeVisible();
    });

    // ==========================================
    // PASO 6: Votar en una coincidencia
    // ==========================================
    await test.step("Votar en una coincidencia", async () => {
      // Si hay coincidencias mostradas, votar "Sí"
      const voteButton = page.getByRole("button", { name: /✓ Sí/ });
      if ((await voteButton.count()) > 0) {
        await voteButton.first().click();
        await expect(
          page.getByRole("button", { name: /✓ Sí/ }).first()
        ).toHaveClass(/bg-green-100/);
      } else {
        // Si no hay coincidencias (porque solo hay un usuario), al menos verificar
        // que la sección de coincidencias se renderiza
        await expect(
          page.getByRole("heading", { name: "Horas en las que coinciden" })
        ).toBeVisible();
      }
    });

    // ==========================================
    // PASO 7: Verificar que el voto se guardó (recargar)
    // ==========================================
    await test.step("Verificar que el voto persiste al recargar", async () => {
      await page.reload();
      await expect(page.getByRole("heading", { name: sessionTitle })).toBeVisible();

      // El voto debería seguir marcado como "Sí"
      const yesButton = page.getByRole("button", { name: /✓ Sí/ }).first();
      if ((await yesButton.count()) > 0) {
        await expect(yesButton).toHaveClass(/bg-green-100/);
      }
    });
  });

  test("flujo alternativo: login con usuario existente", async ({
    page,
  }) => {
    await test.step("Ir a página de login", async () => {
      await page.goto("/login");
      await expect(page).toHaveURL("/login");
      await expect(
        page.getByRole("heading", { name: "Iniciar sesión" })
      ).toBeVisible();
    });

    await test.step("Intentar login con credenciales inválidas", async () => {
      await page.getByLabel("Correo electrónico").fill("usuario-inexistente@example.com");
      await page.getByLabel("Contraseña").fill("contraseña-incorrecta");
      await page.getByRole("button", { name: "Iniciar sesión" }).click();

      // Debería mostrar error de autenticación
      await expect(page.getByText(/credenciales|inválidas|error/i)).toBeVisible();
    });
  });

  test("flujo alternativo: navegar al perfil y ver sesiones creadas", async ({
    page,
  }) => {
    await test.step("Registrar y verificar perfil", async () => {
      await page.goto("/register");
      await page.getByLabel("Nombre completo").fill("Usuario Perfil Test");
      await page.getByLabel("Correo electrónico").fill(`perfil-${Date.now()}@example.com`);
      await page.getByLabel("Contraseña").fill("TestPassword123!");
      await page.getByRole("button", { name: "Crear cuenta" }).click();
      await expect(page).toHaveURL("/session/new");
    });

    await test.step("Ir al perfil y verificar sesiones", async () => {
      await page.getByRole("link", { name: "Perfil" }).click();
      await expect(page).toHaveURL("/profile");
      await expect(
        page.getByRole("heading", { name: "Configuración de perfil" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /Tus sesiones/ })
      ).toBeVisible();
    });
  });
});
