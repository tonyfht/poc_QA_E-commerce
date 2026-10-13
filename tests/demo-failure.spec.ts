/**
 * SUITE DE TESTS — Fallo provocado para la demo (demo-failure.spec.ts)
 * ----------------------------------------------------------------------
 * Un test que falla A PROPÓSITO, sólo cuando se pide explícitamente:
 *
 *     npm run demo:fail
 *
 * Sirve para enseñar en directo qué aporta el informe cuando algo falla:
 *   - El paso exacto en el que falló (pasos de negocio).
 *   - Captura de pantalla en el momento del fallo.
 *   - Vídeo de toda la ejecución.
 *   - Traza de Playwright (DOM, red y consola en cada acción).
 *   - Clasificación automática en la pestaña "Categories".
 *
 * Sin la variable DEMO_FAIL el test se salta (skip), así que nunca rompe
 * una ejecución normal ni el CI.
 */

import * as allure from 'allure-js-commons';
import { authenticatedTest as test, expect } from '../src/fixtures';

test.describe('Demo: failure showcase', () => {
  test('cart badge should count three products', async ({ inventoryPage }) => {
    // eslint-disable-next-line playwright/no-skipped-test -- se salta a propósito salvo en la demo
    test.skip(!process.env.DEMO_FAIL, 'Sólo se ejecuta con DEMO_FAIL=1 (npm run demo:fail)');
    await allure.epic('Compra online');
    await allure.feature('Catálogo de productos');
    await allure.story('Gestión del carrito desde el catálogo');
    await allure.severity(allure.Severity.CRITICAL);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.addProductToCart('Sauce Labs Bike Light');

    // Error intencionado: se han añadido 2 productos, no 3
    await expect(inventoryPage.cartBadge).toHaveText('3', { timeout: 3000 });
  });
});
