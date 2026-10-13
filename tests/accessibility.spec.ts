/**
 * SUITE DE TESTS — Accesibilidad (accessibility.spec.ts)
 * --------------------------------------------------------
 * Audita cada pantalla con axe-core, el motor de reglas de accesibilidad
 * más usado del sector (el mismo de las DevTools de Chrome/Lighthouse).
 *
 * Se comprueban las reglas WCAG 2.1 niveles A y AA, que es el nivel exigido
 * habitualmente por la normativa (en España, RD 1112/2018 y la norma
 * EN 301 549 para el sector público).
 *
 * El resultado completo del análisis se adjunta al informe de Allure como
 * JSON: aunque el test pase, se puede revisar qué reglas se evaluaron.
 *
 * Limitación: axe detecta automáticamente alrededor de un tercio de los
 * problemas de accesibilidad. No sustituye a una revisión manual con
 * lector de pantalla y navegación por teclado.
 */

import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { authenticatedTest, test, expect } from '../src/fixtures';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Ejecuta axe sobre la página actual, adjunta el resultado a Allure y
 * comprueba que no hay violaciones. Si las hay, el mensaje de error lista
 * cada regla incumplida, su impacto y cuántos elementos la incumplen.
 */
async function expectNoAccessibilityViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  await allure.attachment(
    'Análisis axe-core (JSON)',
    JSON.stringify(results, null, 2),
    'application/json'
  );

  const summary = results.violations.map(
    (v) => `${v.id} [${v.impact}] en ${v.nodes.length} elemento(s): ${v.help}`
  );
  expect(summary, 'Violaciones de accesibilidad WCAG 2.1 AA').toEqual([]);
}

test.describe('Accessibility', () => {
  test.beforeEach(async () => {
    await allure.epic('Calidad de interfaz');
    await allure.feature('Accesibilidad (WCAG 2.1 AA)');
    await allure.owner('Equipo QA');
  });

  test('login page should have no WCAG violations', async ({ loginPage }) => {
    await allure.story('Pantalla de login');
    await allure.severity(allure.Severity.CRITICAL);

    await loginPage.goto();
    await expectNoAccessibilityViolations(loginPage.page);
  });
});

authenticatedTest.describe('Accessibility (authenticated)', () => {
  authenticatedTest.beforeEach(async () => {
    await allure.epic('Calidad de interfaz');
    await allure.feature('Accesibilidad (WCAG 2.1 AA)');
    await allure.owner('Equipo QA');
  });

  authenticatedTest('inventory page should have no WCAG violations', async ({
    inventoryPage,
  }) => {
    await allure.story('Catálogo de productos');
    await allure.severity(allure.Severity.CRITICAL);

    await expectNoAccessibilityViolations(inventoryPage.page);
  });

  authenticatedTest('cart page should have no WCAG violations', async ({
    inventoryPage,
    cartPage,
  }) => {
    await allure.story('Carrito');
    await allure.severity(allure.Severity.NORMAL);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.goToCart();
    await expect(cartPage.cartItems).toHaveCount(1);
    await expectNoAccessibilityViolations(cartPage.page);
  });
});
