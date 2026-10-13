/**
 * SUITE DE TESTS — Regresión visual (visual.spec.ts)
 * ----------------------------------------------------
 * Compara capturas de pantalla con una imagen de referencia ("baseline").
 * Detecta cambios que ningún test funcional ve: un botón que cambia de
 * color, un texto que se sale de su caja, un logo que desaparece...
 *
 * CÓMO FUNCIONA
 *   1. La primera vez se generan las referencias:
 *        npx playwright test tests/visual.spec.ts --update-snapshots
 *      Se guardan en tests/visual.spec.ts-snapshots/ y se suben al repo.
 *   2. En cada ejecución, Playwright compara la captura actual con la
 *      referencia píxel a píxel.
 *   3. Si difieren, el test falla y adjunta tres imágenes: esperada,
 *      actual y diferencias (en rojo). Allure las muestra en el test.
 *
 * LIMITACIÓN IMPORTANTE: las fuentes se renderizan distinto en cada sistema
 * operativo, por eso las referencias llevan el SO en el nombre
 * (p. ej. login-page-chromium-win32.png). Las de Windows no sirven en el
 * runner Linux de CI: allí habría que generarlas en Linux (o en Docker).
 */

import * as allure from 'allure-js-commons';
import { authenticatedTest, test, expect } from '../src/fixtures';

test.describe('Visual regression', { tag: '@visual' }, () => {
  test.beforeEach(async () => {
    await allure.epic('Calidad de interfaz');
    await allure.feature('Regresión visual');
    await allure.owner('Equipo QA');
  });

  test('login page should match baseline', async ({ loginPage }) => {
    await allure.story('Pantalla de login');
    await allure.severity(allure.Severity.NORMAL);

    await loginPage.goto();

    await expect(loginPage.page).toHaveScreenshot('login-page.png', { fullPage: true });
  });
});

authenticatedTest.describe('Visual regression (authenticated)', { tag: '@visual' }, () => {
  authenticatedTest('inventory page should match baseline', async ({ inventoryPage }) => {
    await allure.epic('Calidad de interfaz');
    await allure.feature('Regresión visual');
    await allure.owner('Equipo QA');
    await allure.story('Catálogo de productos');
    await allure.severity(allure.Severity.NORMAL);

    await expect(inventoryPage.page).toHaveScreenshot('inventory-page.png', {
      fullPage: true,
    });
  });
});
