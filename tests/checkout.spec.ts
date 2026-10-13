/**
 * SUITE DE TESTS — Carrito y flujo de compra (checkout.spec.ts)
 * --------------------------------------------------------------
 * Verifica el flujo completo de compra de SauceDemo, desde la revisión
 * del carrito hasta la confirmación final del pedido.
 *
 * FIXTURE USADO: `authenticatedTest`
 * Al igual que inventory.spec.ts, el login es una precondición, no el
 * objeto de prueba. El fixture autenticado garantiza que cada test
 * arranca con una sesión activa en la página de inventario.
 *
 * FLUJO QUE CUBRE ESTA SUITE:
 *   Inventario → Carrito → Checkout Paso 1 → Checkout Paso 2 → Confirmación
 *
 * CLASES DE EQUIVALENCIA CUBIERTAS:
 *   ✓ Verificación de ítems en el carrito
 *   ✓ Eliminación de un ítem desde el carrito
 *   ✓ Flujo de compra completo de extremo a extremo (E2E)
 *   ✓ Navegación de retorno: carrito → inventario
 */

import * as allure from 'allure-js-commons';
import { authenticatedTest as test, expect } from '../src/fixtures';
import { checkoutData } from '../src/data/users';

test.describe('Shopping Cart & Checkout Flow', () => {
  /**
   * Setup compartido: antes de cada test se añaden dos productos al carrito.
   *
   * ¿Por qué en beforeEach y no dentro de cada test?
   * Porque tener productos en el carrito es una PRECONDICIÓN para todos los
   * tests de esta suite, no el comportamiento que se está verificando.
   * Extraerlo aquí evita repetición y mantiene los tests enfocados en su
   * responsabilidad específica.
   *
   * Se eligen dos productos distintos para poder verificar tanto el conteo
   * como la eliminación selectiva de uno de ellos.
   */
  test.beforeEach(async ({ inventoryPage }) => {
    await allure.epic('Compra online');
    await allure.feature('Carrito y checkout');
    await allure.owner('Equipo QA');
    await expect(inventoryPage.page).toHaveURL(/inventory\.html/);
    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.addProductToCart('Sauce Labs Bike Light');
  });

  /**
   * Verifica que los productos añadidos desde el inventario aparecen
   * correctamente en la página del carrito.
   *
   * Se comprueban dos aspectos complementarios:
   *   1. La cantidad (2 ítems).
   *   2. Los nombres exactos de los productos.
   * Ambas verificaciones son necesarias: la cantidad podría ser correcta
   * pero con los productos equivocados, o viceversa.
   *
   * .toContain() sobre el array verifica que el nombre está presente
   * en la lista sin importar el orden, lo que hace el test más robusto.
   */
  test('should show correct items in cart', async ({
    inventoryPage,
    cartPage,
  }) => {
    await allure.story('Revisión del carrito');
    await allure.severity(allure.Severity.CRITICAL);

    await inventoryPage.goToCart();

    // toHaveCount reintenta hasta que el carrito se renderiza (aserción web-first)
    await expect(cartPage.cartItems).toHaveCount(2);

    const names = await cartPage.getItemNames();
    expect(names).toContain('Sauce Labs Backpack');
    expect(names).toContain('Sauce Labs Bike Light');
  });

  /**
   * Verifica que se puede eliminar un ítem desde la página del carrito.
   *
   * Tras eliminar un producto, el carrito debe mostrar exactamente 1 ítem.
   * No verificamos cuál queda (podría añadirse) porque lo importante aquí
   * es que la funcionalidad de eliminación reduce correctamente el conteo.
   */
  test('should remove item from cart', async ({
    inventoryPage,
    cartPage,
  }) => {
    await allure.story('Revisión del carrito');
    await allure.severity(allure.Severity.NORMAL);

    await inventoryPage.goToCart();
    await cartPage.removeItem('Sauce Labs Backpack');

    await expect(cartPage.cartItems).toHaveCount(1);
  });

  /**
   * TEST E2E — Flujo de compra completo de extremo a extremo.
   *
   * Este es el test más valioso de la suite: verifica que un usuario puede
   * completar una compra desde el carrito hasta la confirmación sin ningún
   * obstáculo. Es el "happy path" del checkout.
   *
   * Se estructura siguiendo los tres pasos del wizard de checkout de SauceDemo,
   * verificando la URL en cada transición para confirmar que la navegación
   * entre pasos funciona correctamente.
   *
   * La verificación del total usa .toContain('Total:') en lugar del valor
   * exacto porque el importe concreto es un detalle de datos, no de funcionalidad.
   * Lo que importa es que el resumen MUESTRA un total, no cuánto es.
   *
   * La verificación del mensaje de confirmación SÍ es exacta ('Thank you for
   * your order!') porque es el indicador definitivo de que el pedido se procesó.
   */
  test('should complete full checkout flow', { tag: '@smoke' }, async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await allure.story('Compra completa (E2E)');
    await allure.severity(allure.Severity.BLOCKER);
    await allure.tms('DEMO-2');

    await inventoryPage.goToCart();
    await cartPage.checkout();

    // Paso 1: Rellenar datos de envío
    // Se usa checkoutData.valid del dataset para no hardcodear datos en el test.
    await expect(inventoryPage.page).toHaveURL(/checkout-step-one/);
    await checkoutPage.fillCheckoutInfo(checkoutData.valid);
    await checkoutPage.continue();

    // Paso 2: Revisar y confirmar el pedido
    // La presencia de 'Total:' confirma que el resumen de precio se renderizó.
    await expect(inventoryPage.page).toHaveURL(/checkout-step-two/);
    const total = await checkoutPage.getTotal();
    expect(total).toContain('Total:');

    // Paso 3: Finalizar y verificar la confirmación
    await checkoutPage.finish();
    await expect(inventoryPage.page).toHaveURL(/checkout-complete/);

    const confirmation = await checkoutPage.getConfirmationMessage();
    expect(confirmation).toBe('Thank you for your order!');
  });

  /**
   * Verifica la navegación de retorno desde el carrito al catálogo.
   *
   * El botón "Continue Shopping" debe volver al inventario sin perder
   * los productos del carrito (SauceDemo mantiene el estado del carrito).
   * Este test cubre el flujo alternativo: el usuario decide seguir comprando
   * en lugar de proceder al checkout.
   */
  test('should navigate back to inventory from cart', async ({
    inventoryPage,
    cartPage,
  }) => {
    await allure.story('Navegación del carrito');
    await allure.severity(allure.Severity.MINOR);

    await inventoryPage.goToCart();
    await cartPage.continueShopping();

    await expect(inventoryPage.page).toHaveURL(/inventory\.html/);
  });
});
