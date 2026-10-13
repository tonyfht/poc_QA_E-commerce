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
 * METADATOS ALLURE
 * Cada test declara epic / feature / story / severity. Con ellos Allure
 * rellena la pestaña "Behaviors" (árbol funcional) y permite filtrar por
 * criticidad. `allure.tms()` enlaza con el caso de prueba en Jira.
 */

import * as allure from 'allure-js-commons';
import { test, expect } from '../src/fixtures';
import { users } from '../src/data/users';

test.describe('Authentication', () => {
  /**
   * Precondición compartida: todos los tests de esta suite parten
   * de la pantalla de login. Los metadatos comunes (epic, feature, owner)
   * se declaran aquí una sola vez para toda la suite.
   */
  test.beforeEach(async ({ loginPage }) => {
    await allure.epic('Acceso a la aplicación');
    await allure.feature('Autenticación');
    await allure.owner('Equipo QA');
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
  test('should login successfully with valid credentials', { tag: '@smoke' }, async ({
    loginPage,
  }) => {
    await allure.story('Login correcto');
    await allure.severity(allure.Severity.BLOCKER);
    await allure.tms('DEMO-1');

    await loginPage.login(users.standard.username, users.standard.password);

    await expect(loginPage.page).toHaveURL(/inventory\.html/);
  });

  /**
   * TESTS GUIADOS POR DATOS (data-driven) — accesos denegados.
   *
   * En lugar de escribir un test casi idéntico por cada caso de error,
   * se define una TABLA de casos y se genera un test por fila. Añadir un
   * caso nuevo es añadir una línea, no copiar un test entero.
   *
   * En Allure, cada fila aparece como un test independiente y sus datos
   * de entrada se muestran en la sección "Parameters" gracias a
   * `allure.parameter()` (la contraseña se enmascara).
   *
   * Nota de seguridad sobre los mensajes: SauceDemo usa mensajes distintos
   * para "usuario bloqueado" y "credenciales incorrectas". Es útil para la
   * demo, pero en una aplicación real es una mala práctica: un mensaje
   * diferenciado revela a un atacante que el usuario EXISTE (enumeración
   * de usuarios). Lo recomendable es un mensaje genérico idéntico.
   */
  const deniedAccessCases = [
    {
      title: 'locked out user',
      username: users.locked.username,
      password: users.locked.password,
      expectedError: 'Sorry, this user has been locked out.',
      severity: allure.Severity.CRITICAL,
    },
    {
      title: 'invalid credentials',
      username: 'invalid_user',
      password: 'wrong_password',
      expectedError: 'Username and password do not match any user in this service',
      severity: allure.Severity.CRITICAL,
    },
    {
      title: 'empty credentials',
      username: '',
      password: '',
      expectedError: 'Username is required',
      severity: allure.Severity.NORMAL,
    },
    {
      title: 'missing password',
      username: users.standard.username,
      password: '',
      expectedError: 'Password is required',
      severity: allure.Severity.NORMAL,
    },
  ];

  for (const testCase of deniedAccessCases) {
    test(`should deny access: ${testCase.title}`, async ({ loginPage }) => {
      await allure.story('Acceso denegado');
      await allure.severity(testCase.severity);
      await allure.parameter('username', testCase.username || '(vacío)');
      await allure.parameter('password', testCase.password, { mode: 'masked' });

      await loginPage.login(testCase.username, testCase.password);

      // Aserción web-first: reintenta hasta que el mensaje aparece
      await expect(loginPage.errorMessage).toContainText(testCase.expectedError);
      await expect(loginPage.page).not.toHaveURL(/inventory\.html/);
    });
  }

  /**
   * Logout — verificación del cierre de sesión.
   *
   * Primero realiza el login (happy path) y luego verifica que el logout
   * devuelve al usuario a la pantalla de login (URL raíz '/').
   * Este test cubre la funcionalidad completa de gestión de sesión:
   * creación (login) y destrucción (logout).
   */
  test('should logout successfully', { tag: '@smoke' }, async ({
    loginPage,
    inventoryPage,
  }) => {
    await allure.story('Logout');
    await allure.severity(allure.Severity.CRITICAL);

    await loginPage.login(users.standard.username, users.standard.password);
    await inventoryPage.logout();

    await expect(loginPage.page).toHaveURL('/');
  });
});
