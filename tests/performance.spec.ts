/**
 * SUITE DE TESTS — Rendimiento percibido del login (performance.spec.ts)
 * ------------------------------------------------------------------------
 * Mide cuánto tarda el login, desde el clic en "Login" hasta que el catálogo
 * está visible, y lo compara con un PRESUPUESTO DE RENDIMIENTO (performance
 * budget): un tiempo máximo acordado con negocio.
 *
 * SauceDemo incluye `performance_glitch_user`, que simula un backend lento.
 * Se ejecuta el mismo test con los dos usuarios (data-driven) para que la
 * diferencia se vea de un vistazo en Allure:
 *   - Pestaña "Timeline": la barra del usuario lento es claramente más larga.
 *   - Cada test adjunta su tiempo medido como parámetro.
 *
 * No es un test de carga (para eso existen JMeter, k6...): mide la
 * experiencia de UN usuario en el navegador real.
 */

import * as allure from 'allure-js-commons';
import { test, expect } from '../src/fixtures';
import { users } from '../src/data/users';

/** Tiempo máximo aceptable para entrar a la aplicación (milisegundos). */
const LOGIN_BUDGET_MS = 3000;

const loginTimingCases = [
  { user: users.standard, knownIssue: undefined },
  { user: users.performance, knownIssue: 'DEMO-103' },
];

test.describe('Login performance', () => {
  test.beforeEach(async ({ loginPage }) => {
    await allure.epic('Acceso a la aplicación');
    await allure.feature('Rendimiento');
    await allure.owner('Equipo QA');
    await loginPage.goto();
  });

  for (const { user, knownIssue } of loginTimingCases) {
    test(`login should finish within budget: ${user.username}`, async ({
      loginPage,
      inventoryPage,
    }) => {
      // eslint-disable-next-line playwright/no-conditional-in-test -- sólo el usuario lento es defecto conocido
      if (knownIssue) {
        test.fail(true, `Defecto conocido ${knownIssue}: login lento`);
        await allure.issue(knownIssue);
      }
      await allure.story('Tiempo de login');
      await allure.severity(allure.Severity.NORMAL);
      await allure.parameter('usuario', user.username);
      await allure.parameter('presupuesto', `${LOGIN_BUDGET_MS} ms`);

      const start = Date.now();
      await loginPage.login(user.username, user.password);
      await expect(inventoryPage.page).toHaveURL(/inventory\.html/, { timeout: 15_000 });
      expect(await inventoryPage.getProductCount()).toBe(6);
      const elapsedMs = Date.now() - start;

      await allure.parameter('tiempo medido', `${elapsedMs} ms`);
      expect(
        elapsedMs,
        `Presupuesto de rendimiento: login en ${elapsedMs} ms (máx. ${LOGIN_BUDGET_MS} ms)`
      ).toBeLessThan(LOGIN_BUDGET_MS);
    });
  }
});
