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
 *   ✓ Ordenación por precio ascendente
 *   ✓ Ordenación por precio descendente
 *   ✓ Ordenación por nombre alfabético
 */

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
    await expect(inventoryPage.page).toHaveURL(/inventory\.html/);
  });

  /**
   * Verifica que el catálogo muestra exactamente 6 productos.
   * SauceDemo tiene un catálogo fijo de 6 ítems para el usuario estándar.
   * Si este número cambiara, sería señal de un problema en la aplicación
   * (filtro activo, error de carga, cambio en los datos de prueba, etc.).
   */
  test('should display 6 products', async ({ inventoryPage }) => {
    const count = await inventoryPage.getProductCount();
    expect(count).toBe(6);
  });

  /**
   * Verifica que añadir un producto actualiza correctamente el contador del carrito.
   *
   * El "Sauce Labs Backpack" se eligió como producto de referencia por ser
   * el primero de la lista en el orden por defecto — es el más predecible
   * y menos probable de verse afectado por cambios de datos.
   *
   * La verificación se hace sobre el badge del carrito (número visible en la UI)
   * en lugar de navegar al carrito, lo que hace este test más rápido y enfocado.
   */
  test('should add a product to cart', async ({ inventoryPage }) => {
    await inventoryPage.addProductToCart('Sauce Labs Backpack');

    const cartCount = await inventoryPage.getCartCount();
    expect(cartCount).toBe(1);
  });

  /**
   * Verifica que se pueden añadir múltiples productos y el contador los acumula.
   * Se añaden dos productos distintos para confirmar que:
   *   1. El segundo producto no reemplaza al primero.
   *   2. El badge muestra la suma correcta.
   */
  test('should add multiple products to cart', async ({ inventoryPage }) => {
    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.addProductToCart('Sauce Labs Bike Light');

    const cartCount = await inventoryPage.getCartCount();
    expect(cartCount).toBe(2);
  });

  /**
   * Verifica que eliminar un producto desde el inventario reduce el contador.
   *
   * El flujo es: añadir → eliminar → verificar que el carrito está vacío (0).
   * Cuando el carrito queda vacío, el badge desaparece del DOM — getCartCount()
   * en InventoryPage maneja este caso devolviendo 0 cuando el badge no existe.
   */
  test('should remove a product from cart', async ({ inventoryPage }) => {
    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.removeProductFromCart('Sauce Labs Backpack');

    const cartCount = await inventoryPage.getCartCount();
    expect(cartCount).toBe(0);
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
  test('should sort products by price low to high', async ({
    inventoryPage,
  }) => {
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
  test('should sort products by price high to low', async ({
    inventoryPage,
  }) => {
    await inventoryPage.sortBy('hilo');
    const prices = await inventoryPage.getProductPrices();

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  /**
   * Verifica la ordenación alfabética de A a Z.
   *
   * La estrategia: obtener los nombres tal como los devuelve la UI,
   * crear una copia ordenada con JavaScript nativo y comparar ambas.
   * Si la UI devuelve el orden correcto, los dos arrays serán iguales.
   *
   * Se usa spread ([...names]) para no mutar el array original al ordenarlo,
   * ya que .sort() en JavaScript modifica el array in-place.
   *
   * toEqual() compara arrays elemento a elemento (igualdad profunda),
   * a diferencia de toBe() que compara referencias.
   */
  test('should sort products by name A to Z', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('az');
    const names = await inventoryPage.getProductNames();
    const sorted = [...names].sort();

    expect(names).toEqual(sorted);
  });
});
