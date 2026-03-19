/**
 * SUITE DE TESTS — Autenticación (auth.spec.ts)
 * -----------------------------------------------
 * Verifica el comportamiento del sistema de login de SauceDemo cubriendo
 * las principales clases de equivalencia del proceso de autenticación:
 *
 *   ✓ Credenciales válidas                → acceso concedido
 *   ✓ Usuario bloqueado por política      → acceso denegado con mensaje específico
 *   ✓ Credenciales incorrectas            → acceso denegado con mensaje específico
 *   ✓ Campos vacíos (validación frontend) → acceso denegado con mensaje específico
 *   ✓ Logout                              → sesión cerrada y redirección al login
 *
 * Se usa el fixture `test` (sin autenticación previa) porque en esta suite
 * el propio proceso de login ES lo que se está testeando. Usar el fixture
 * autenticado no tendría sentido aquí.
 *
 * El beforeEach navega a la pantalla de login antes de cada test, garantizando
 * un punto de partida limpio e independiente entre tests.
 */

import { test, expect } from '../src/fixtures';
import { users } from '../src/data/users';

test.describe('Authentication', () => {
  /**
   * Precondición compartida: todos los tests de esta suite parten
   * de la pantalla de login con la página cargada y lista.
   * Centralizar esto en beforeEach evita repetirlo en cada test y hace
   * que el setup sea explícito y visible para quien lee la suite.
   */
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  /**
   * CAMINO FELIZ (Happy Path) — Login exitoso con credenciales válidas.
   *
   * Verifica que tras un login correcto la URL cambia a /inventory.html,
   * que es la señal inequívoca de que el usuario ha accedido al sistema.
   * Se usa toHaveURL con una expresión regular para no acoplarse a la URL
   * completa (que podría cambiar de entorno), sino al fragmento significativo.
   */
  test('should login successfully with valid credentials', async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.login(users.standard.username, users.standard.password);

    // La navegación a /inventory.html confirma que el login fue exitoso
    // y que la sesión está activa. No es necesario verificar ningún elemento
    // de la página — la URL es suficiente para este caso.
    await expect(inventoryPage.page).toHaveURL(/inventory\.html/);
  });

  /**
   * Usuario bloqueado — verificación del control de acceso por política.
   *
   * Este test distingue entre "credenciales incorrectas" y "acceso denegado
   * por política". El usuario locked_out_user tiene credenciales válidas
   * (misma contraseña que el resto), pero su cuenta está bloqueada.
   * La aplicación debe rechazarlo con un mensaje que lo deje claro.
   *
   * Se verifica primero que el error ES visible, y luego que su texto
   * CONTIENE 'locked out'. Usar .toContain() en lugar de igualdad exacta
   * hace el test más resiliente ante cambios menores en la redacción del mensaje.
   */
  test('should show error for locked out user', async ({ loginPage }) => {
    await loginPage.login(users.locked.username, users.locked.password);

    expect(await loginPage.isErrorVisible()).toBe(true);
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('locked out');
  });

  /**
   * Credenciales inválidas — verificación del mensaje de error estándar.
   *
   * Se usan credenciales completamente inventadas ('invalid_user', 'wrong_password')
   * para simular un intento de acceso de alguien que no tiene cuenta.
   * Es importante que este mensaje sea diferente al del usuario bloqueado:
   * dar el mismo mensaje en ambos casos sería un problema de seguridad
   * (revelaría que el username existe pero está bloqueado).
   */
  test('should show error with invalid credentials', async ({ loginPage }) => {
    await loginPage.login('invalid_user', 'wrong_password');

    expect(await loginPage.isErrorVisible()).toBe(true);
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Username and password do not match');
  });

  /**
   * Campos vacíos — verificación de la validación del lado del cliente.
   *
   * Intentar el submit sin rellenar ningún campo debe ser interceptado
   * por la validación del formulario antes de llegar al servidor.
   * Se verifica que el mensaje de error indica específicamente que
   * el username es requerido (la validación se hace campo por campo,
   * empezando por el primero).
   */
  test('should show error with empty credentials', async ({ loginPage }) => {
    await loginPage.login('', '');

    expect(await loginPage.isErrorVisible()).toBe(true);
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Username is required');
  });

  /**
   * Logout — verificación del cierre de sesión.
   *
   * Primero realiza el login (happy path) y luego verifica que el logout
   * devuelve al usuario a la pantalla de login (URL raíz '/').
   * Este test cubre la funcionalidad completa de gestión de sesión:
   * creación (login) y destrucción (logout).
   *
   * La URL esperada es '/' porque la raíz de SauceDemo es siempre
   * la pantalla de login cuando no hay sesión activa.
   */
  test('should logout successfully', async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.login(users.standard.username, users.standard.password);
    await inventoryPage.logout();

    await expect(loginPage.page).toHaveURL('/');
  });
});
