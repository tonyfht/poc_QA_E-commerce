/**
 * SUITE DE TESTS — Catálogo de productos (inventory.spec.ts)
 * -----------------------------------------------------------
 * Verifica el comportamiento de la página de inventario ('/inventory.html'):
 * visualización del catálogo, gestión del carrito desde el catálogo
 * y ordenación de productos.
 *
 * FIXTURE USADO: `authenticatedTest`
 * Esta suite usa el fixture autenticado deliberadamente: el login no es
 * lo que se está probando aquí. Llegar al inventario es una PRECONDICIÓN,
 * no un paso del test. Al delegar el login al fixture, cada test es más
 * corto, más enfocado y más fácil de leer.
 *
 * CLASES DE EQUIVALENCIA CUBIERTAS:
 *   ✓ Renderizado del catálogo (número de productos)
 *   ✓ Añadir un producto al carrito
 *   ✓ Añadir múltiples productos al carrito
 *   ✓ Eliminar un producto del carrito
 *   ✓ Ordenación por precio ascendente / descendente
 *   ✓ Ordenación por nombre Z→A y A→Z
 */

import * as allure from 'allure-js-commons';
import { authenticatedTest as test, expect } from '../src/fixtures';

test.describe('Inventory / Product Catalog', () => {
  /**
   * Precondición de la suite: verificar que el fixture autenticado
   * funcionó correctamente y estamos en la página de inventario.
   *
   * Este beforeEach actúa como un "guard": si el login fallara por
   * algún motivo (p. ej. SauceDemo caído), todos los tests fallarían
   * aquí con un mensaje claro en lugar de en puntos aleatorios con
   * errores confusos de "elemento no encontrado".
   */
  test.beforeEach(async ({ inventoryPage }) => {
    await allure.epic('Compra online');
    await allure.feature('Catálogo de productos');
    await allure.owner('Equipo QA');
    await expect(inventoryPage.page).toHaveURL(/inventory\.html/);
  });

  /**
   * Verifica que el catálogo muestra exactamente 6 productos.
   * SauceDemo tiene un catálogo fijo de 6 ítems para el usuario estándar.
   * Si este número cambiara, sería señal de un problema en la aplicación
   * (filtro activo, error de carga, cambio en los datos de prueba, etc.).
   */
  test('should display 6 products', { tag: '@smoke' }, async ({ inventoryPage }) => {
    await allure.story('Visualización del catálogo');
    await allure.severity(allure.Severity.BLOCKER);

    expect(await inventoryPage.getProductCount()).toBe(6);
  });

  /**
   * Verifica que añadir un producto actualiza correctamente el contador del carrito.
   *
   * La verificación se hace sobre el badge del carrito (número visible en la UI)
   * en lugar de navegar al carrito, lo que hace este test más rápido y enfocado.
   * `toHaveText` es web-first: reintenta hasta que el badge muestra el valor.
   */
  test('should add a product to cart', async ({ inventoryPage }) => {
    await allure.story('Gestión del carrito desde el catálogo');
    await allure.severity(allure.Severity.CRITICAL);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');

    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  /**
   * Verifica que se pueden añadir múltiples productos y el contador los acumula.
   * Se añaden dos productos distintos para confirmar que:
   *   1. El segundo producto no reemplaza al primero.
   *   2. El badge muestra la suma correcta.
   */
  test('should add multiple products to cart', async ({ inventoryPage }) => {
    await allure.story('Gestión del carrito desde el catálogo');
    await allure.severity(allure.Severity.CRITICAL);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.addProductToCart('Sauce Labs Bike Light');

    await expect(inventoryPage.cartBadge).toHaveText('2');
  });

  /**
   * Verifica que eliminar un producto desde el inventario vacía el carrito.
   *
   * Cuando el carrito queda vacío, el badge desaparece del DOM.
   * `toBeHidden()` se cumple tanto si el elemento está oculto como si no
   * existe, y reintenta hasta que desaparece.
   */
  test('should remove a product from cart', async ({ inventoryPage }) => {
    await allure.story('Gestión del carrito desde el catálogo');
    await allure.severity(allure.Severity.NORMAL);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await expect(inventoryPage.cartBadge).toHaveText('1');

    await inventoryPage.removeProductFromCart('Sauce Labs Backpack');

    await expect(inventoryPage.cartBadge).toBeHidden();
  });

  /**
   * Verifica la ordenación por precio de menor a mayor.
   *
   * La estrategia de verificación es algorítmica: en lugar de comparar contra
   * valores fijos (frágil si los precios cambian), se comprueba la propiedad
   * matemática del orden: cada precio debe ser >= al anterior.
   *
   * getProductPrices() devuelve números (no strings con '$') precisamente para
   * poder usar .toBeGreaterThanOrEqual() sin conversiones en el test.
   */
  test('should sort products by price low to high', async ({ inventoryPage }) => {
    await allure.story('Ordenación del catálogo');
    await allure.severity(allure.Severity.NORMAL);

    await inventoryPage.sortBy('lohi');
    const prices = await inventoryPage.getProductPrices();

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  /**
   * Verifica la ordenación por precio de mayor a menor.
   * Misma estrategia algorítmica que el test anterior, con la propiedad inversa:
   * cada precio debe ser <= al anterior.
   */
  test('should sort products by price high to low', async ({ inventoryPage }) => {
    await allure.story('Ordenación del catálogo');
    await allure.severity(allure.Severity.NORMAL);

    await inventoryPage.sortBy('hilo');
    const prices = await inventoryPage.getProductPrices();

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  /**
   * Verifica la ordenación alfabética de Z a A.
   *
   * La estrategia: obtener los nombres tal como los devuelve la UI,
   * crear una copia ordenada con JavaScript nativo y comparar ambas.
   * Se usa spread ([...names]) para no mutar el array original, ya que
   * .sort() modifica el array in-place. `localeCompare` ordena como lo
   * haría una persona (no por código Unicode).
   */
  test('should sort products by name Z to A', async ({ inventoryPage }) => {
    await allure.story('Ordenación del catálogo');
    await allure.severity(allure.Severity.NORMAL);

    await inventoryPage.sortBy('za');
    const names = await inventoryPage.getProductNames();

    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  /**
   * Verifica la ordenación alfabética de A a Z.
   *
   * OJO — trampa habitual: el catálogo YA viene ordenado A→Z por defecto.
   * Si sólo eligiéramos 'az' y comprobáramos el orden, el test pasaría
   * aunque la ordenación estuviera rota. Por eso primero se fuerza el
   * orden contrario (Z→A) y después se vuelve a A→Z: así el test sólo
   * pasa si la ordenación realmente funciona.
   */
  test('should sort products by name A to Z', async ({ inventoryPage }) => {
    await allure.story('Ordenación del catálogo');
    await allure.severity(allure.Severity.NORMAL);

    await inventoryPage.sortBy('za');
    await inventoryPage.sortBy('az');
    const names = await inventoryPage.getProductNames();

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
