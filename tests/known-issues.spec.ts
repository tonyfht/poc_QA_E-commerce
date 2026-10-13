/**
 * SUITE DE TESTS — Defectos conocidos (known-issues.spec.ts)
 * ------------------------------------------------------------
 * SauceDemo incluye a propósito un usuario con bugs: `problem_user`.
 * Esta suite demuestra cómo se gestionan en automatización los DEFECTOS
 * CONOCIDOS del producto, es decir, bugs ya reportados que aún no se han
 * corregido.
 *
 * ¿Por qué no simplemente borrar o saltar (skip) estos tests?
 *   - Borrarlos: se pierde la cobertura y nadie se entera cuando el bug
 *     se corrige.
 *   - Saltarlos: igual, el test nunca se ejecuta.
 *
 * `test.fail()` marca el test como "se ESPERA que falle":
 *   - Mientras el bug exista → el test falla → Playwright lo da por BUENO.
 *   - Cuando alguien corrija el bug → el test pasa → Playwright lo marca
 *     como ERROR ("expected to fail, but passed"). Es la señal para quitar
 *     el `test.fail()` y cerrar el ticket.
 *
 * Cada test enlaza su ticket con `allure.issue()`, así el informe muestra
 * el enlace directo al bug en Jira.
 */

import * as allure from 'allure-js-commons';
import { authenticatedTest as test, expect } from '../src/fixtures';
import { users } from '../src/data/users';

/**
 * Toda la suite se ejecuta con `problem_user` en lugar del usuario estándar.
 * `user` es una opción de ámbito worker del fixture autenticado, por eso
 * se configura a nivel de fichero (no dentro de un describe).
 */
test.use({ user: users.problem });

test.describe('Known issues (problem_user)', () => {
  test.beforeEach(async () => {
    await allure.epic('Compra online');
    await allure.feature('Defectos conocidos');
    await allure.owner('Equipo QA');
  });

  /**
   * BUG DEMO-101: todos los productos muestran la misma imagen.
   * Para el usuario estándar, cada producto tiene su foto; con
   * problem_user se repite la misma imagen en los 6 productos.
   */
  test('each product should have its own image', async ({ inventoryPage }) => {
    test.fail(true, 'Defecto conocido DEMO-101: imágenes de producto repetidas');
    await allure.story('Imágenes del catálogo');
    await allure.severity(allure.Severity.MINOR);
    await allure.issue('DEMO-101');

    const sources = await inventoryPage.getProductImageSources();
    const distinctImages = new Set(sources).size;

    expect(distinctImages, 'cada producto debería tener una imagen distinta').toBe(
      sources.length
    );
  });

  /**
   * BUG DEMO-102: la ordenación del catálogo no hace nada.
   * El desplegable cambia, pero los productos se quedan en el orden original.
   */
  test('should sort products by name Z to A', async ({ inventoryPage }) => {
    test.fail(true, 'Defecto conocido DEMO-102: la ordenación no reordena');
    await allure.story('Ordenación del catálogo');
    await allure.severity(allure.Severity.NORMAL);
    await allure.issue('DEMO-102');

    await inventoryPage.sortBy('za');
    const names = await inventoryPage.getProductNames();

    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });
});
