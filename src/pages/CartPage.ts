/**
 * PAGE OBJECT — CartPage
 * -----------------------
 * Representa la página del carrito de la compra ('/cart.html').
 * Es una página intermedia en el flujo de compra: el usuario llega aquí
 * desde el inventario y desde aquí puede iniciar el checkout o volver
 * a seguir comprando.
 *
 * Desde el punto de vista de testing, esta página tiene dos responsabilidades:
 *   1. Verificar que los productos añadidos desde el inventario aparecen
 *      correctamente (nombres, cantidades).
 *   2. Actuar como punto de entrada al flujo de checkout.
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  /**
   * Colección de todos los productos presentes en el carrito.
   * Usa selector de clase CSS ('.cart_item') porque SauceDemo no provee
   * atributo data-test para el contenedor de cada ítem del carrito —
   * sí los provee para los botones de acción, pero no para el wrapper completo.
   *
   * Al trabajar con una colección (Locator de múltiples elementos), podemos
   * usar .filter() para buscar un ítem específico.
   *
   * Es público (no private) para que los tests puedan usar aserciones
   * web-first como `expect(cartPage.cartItems).toHaveCount(2)`, que reintentan
   * hasta que el carrito termina de renderizarse. Leer `.count()` y compararlo
   * con `expect(n).toBe(2)` toma una foto instantánea y falla de forma
   * intermitente si la página aún no se ha pintado tras la navegación.
   */
  readonly cartItems: Locator;

  /**
   * Botón "Checkout": inicia el proceso de compra.
   * Usa data-test, que SauceDemo provee consistentemente para los CTAs
   * (Call-To-Action) principales de la aplicación.
   */
  private readonly checkoutButton: Locator;

  /**
   * Botón "Continue Shopping": vuelve al catálogo sin iniciar el checkout.
   * Permite verificar la navegación inversa (carrito → inventario).
   */
  private readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems = page.locator('.cart_item');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator(
      '[data-test="continue-shopping"]'
    );
  }

  /**
   * Devuelve los nombres de todos los productos del carrito.
   * Se usa para verificar que los productos correctos llegaron al carrito,
   * comparando con los nombres que se añadieron desde el inventario.
   *
   * Reutiliza el mismo selector '.inventory_item_name' que InventoryPage
   * porque SauceDemo usa el mismo componente de nombre tanto en el catálogo
   * como en el carrito.
   */
  async getItemNames(): Promise<string[]> {
    return this.cartItems
      .locator('.inventory_item_name')
      .allInnerTexts();
  }

  /**
   * Elimina un producto del carrito buscándolo por nombre.
   *
   * Al igual que en InventoryPage, se usa .filter({ hasText }) para
   * identificar unívocamente el ítem por su nombre antes de hacer clic
   * en su botón "Remove". Esto evita depender de índices o posiciones.
   *
   * @param itemName - Nombre del producto a eliminar, tal como aparece en el carrito.
   */
  async removeItem(itemName: string): Promise<void> {
    await this.step(`Quitar "${itemName}" desde el carrito`, async () => {
      const item = this.cartItems.filter({ hasText: itemName });
      await item.locator('button').click();
    });
  }

  /**
   * Hace clic en el botón "Checkout" para iniciar el proceso de compra.
   * Después de llamar a este método, la aplicación navega a '/checkout-step-one.html'.
   */
  async checkout(): Promise<void> {
    await this.step('Iniciar el checkout', () => this.checkoutButton.click());
  }

  /**
   * Hace clic en "Continue Shopping" para volver al catálogo de productos.
   * Permite verificar que el usuario puede abandonar el carrito y retomar
   * la compra sin perder los productos ya añadidos.
   */
  async continueShopping(): Promise<void> {
    await this.step('Volver al catálogo ("Continue Shopping")', () =>
      this.continueShoppingButton.click()
    );
  }
}
