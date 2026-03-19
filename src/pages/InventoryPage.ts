/**
 * PAGE OBJECT — InventoryPage
 * ----------------------------
 * Representa la página principal de productos de SauceDemo ('/inventory.html').
 * Es la página central de la aplicación: punto de llegada tras el login,
 * origen de las acciones de añadir/quitar productos del carrito y acceso
 * a la navegación global (carrito, menú lateral).
 *
 * Al ser la página más rica en funcionalidad, este Page Object concentra
 * la mayor variedad de estrategias de localización, reflejando la realidad
 * de las aplicaciones: no todos los elementos tienen atributos `data-test`.
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class InventoryPage extends BasePage {
  /**
   * Locator que representa TODOS los productos del catálogo.
   * '.inventory_item' es un selector de clase CSS que devuelve una colección.
   * Playwright trabaja con colecciones de forma nativa — no es necesario
   * iterar manualmente; métodos como .count(), .filter() o .allInnerTexts()
   * operan sobre toda la colección de una vez.
   *
   * Se usa clase CSS aquí porque '.inventory_item' es el identificador
   * semántico del componente en el HTML de SauceDemo, no hay alternativa
   * con data-test para el contenedor del producto completo.
   */
  private readonly productList: Locator;

  /**
   * Icono del carrito en la barra de navegación superior.
   * Usa data-test porque SauceDemo lo provee para este elemento de navegación.
   */
  private readonly cartIcon: Locator;

  /**
   * Badge numérico sobre el icono del carrito.
   * IMPORTANTE: este elemento NO existe en el DOM cuando el carrito está vacío —
   * no está oculto con display:none, directamente no se renderiza.
   * Por eso getCartCount() debe comprobar su visibilidad antes de leer su texto.
   */
  private readonly cartBadge: Locator;

  /**
   * Selector del ordenamiento de productos.
   * Es un elemento <select> nativo del navegador, que Playwright puede
   * manejar con .selectOption() sin necesidad de abrir ningún dropdown custom.
   */
  private readonly sortDropdown: Locator;

  /**
   * Botón de menú hamburguesa (☰) en la esquina superior izquierda.
   * ESTRATEGIA: se usa selector de ID (#react-burger-menu-btn) porque este
   * elemento NO tiene atributo data-test en SauceDemo. El ID es el siguiente
   * selector más estable después de data-test, más robusto que las clases CSS.
   */
  private readonly burgerMenu: Locator;

  /**
   * Enlace de logout dentro del menú lateral.
   * Igual que burgerMenu, usa ID porque es lo que provee la aplicación.
   * Aparece en el DOM desde el inicio pero está visualmente oculto hasta
   * que se abre el menú lateral.
   */
  private readonly logoutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.productList = page.locator('.inventory_item');
    this.cartIcon = page.locator('[data-test="shopping-cart-link"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.burgerMenu = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
  }

  /**
   * Comprueba si la URL actual corresponde a la página de inventario.
   * Se usa como aserción de precondición en los tests (beforeEach)
   * para garantizar que el fixture de autenticación funcionó correctamente
   * antes de ejecutar cada test.
   */
  async isOnInventoryPage(): Promise<boolean> {
    return this.page.url().includes('/inventory.html');
  }

  /**
   * Devuelve el número total de productos visibles en el catálogo.
   * SauceDemo siempre muestra 6 productos para el usuario estándar.
   * Este método permite verificar que ningún filtro activo está ocultando
   * productos o que la página cargó completamente.
   */
  async getProductCount(): Promise<number> {
    return this.productList.count();
  }

  /**
   * Devuelve los nombres de todos los productos como array de strings.
   * Se usa para verificar el orden alfabético tras aplicar la ordenación 'az'.
   *
   * .allInnerTexts() es un método de Playwright que resuelve todos los
   * elementos de la colección de una vez, más eficiente que iterar uno a uno.
   */
  async getProductNames(): Promise<string[]> {
    return this.productList.locator('.inventory_item_name').allInnerTexts();
  }

  /**
   * Devuelve los precios de todos los productos como array de números.
   *
   * La conversión de texto a número es deliberada: devolver strings como
   * '$7.99' haría imposible la comparación matemática (mayor/menor que).
   * Al parsear a float se eliminan el símbolo '$' y se permite comparar
   * precios directamente con .toBeGreaterThanOrEqual() en los tests.
   *
   * Ejemplo de transformación: '$7.99' → parseFloat('7.99') → 7.99
   */
  async getProductPrices(): Promise<number[]> {
    const priceTexts = await this.productList
      .locator('.inventory_item_price')
      .allInnerTexts();
    return priceTexts.map((price) => parseFloat(price.replace('$', '')));
  }

  /**
   * Añade un producto específico al carrito buscándolo por nombre.
   *
   * .filter({ hasText: productName }) es la forma idiomática en Playwright
   * de narrowing (acotar) una colección: de todos los '.inventory_item'
   * nos quedamos sólo con el que contiene el texto del nombre del producto.
   * Esto es más robusto que usar índices (que cambiarían si el orden varía).
   *
   * El botón se localiza de forma relativa al producto filtrado, así nunca
   * se confunde con el botón de otro producto aunque haya múltiples en pantalla.
   *
   * @param productName - Nombre exacto del producto tal como aparece en la UI.
   */
  async addProductToCart(productName: string): Promise<void> {
    const product = this.productList.filter({
      hasText: productName,
    });
    await product.locator('button').click();
  }

  /**
   * Elimina un producto del carrito desde la página de inventario.
   *
   * SauceDemo implementa un toggle en el botón del producto: cuando el
   * producto está en el carrito, el mismo botón que decía "Add to cart"
   * pasa a decir "Remove". La interacción es idéntica (click en el botón
   * del producto filtrado), por eso la implementación es igual a addProductToCart.
   *
   * Tener métodos con nombres distintos aunque la implementación sea igual
   * es correcto: el nombre expresa la INTENCIÓN del test, no el mecanismo.
   *
   * @param productName - Nombre exacto del producto a eliminar del carrito.
   */
  async removeProductFromCart(productName: string): Promise<void> {
    const product = this.productList.filter({ hasText: productName });
    await product.locator('button').click();
  }

  /**
   * Devuelve el número de productos actualmente en el carrito.
   *
   * El badge del carrito sólo existe en el DOM cuando hay al menos un producto.
   * Si se intentara leer innerText() de un elemento inexistente, Playwright
   * lanzaría un error. Por eso se comprueba primero la visibilidad:
   *   - Si no es visible → el carrito está vacío → devuelve 0.
   *   - Si es visible → se lee y parsea el número del badge.
   *
   * parseInt con base 10 es una buena práctica explícita para evitar
   * interpretaciones en octal u otras bases en entornos legacy.
   */
  async getCartCount(): Promise<number> {
    const isVisible = await this.cartBadge.isVisible();
    if (!isVisible) return 0;
    const text = await this.cartBadge.innerText();
    return parseInt(text, 10);
  }

  /**
   * Selecciona una opción de ordenación del catálogo.
   *
   * Los valores corresponden exactamente a los atributos `value` de las
   * opciones del <select> en el HTML de SauceDemo:
   *   'az'   → Name (A to Z)
   *   'za'   → Name (Z to A)
   *   'lohi' → Price (low to high)
   *   'hilo' → Price (high to low)
   *
   * El tipo literal de TypeScript restringe los valores posibles en tiempo
   * de compilación, evitando que un test pase un valor inválido que silenciosamente
   * no ordenaría nada.
   *
   * @param option - Código de ordenación aceptado por el selector de SauceDemo.
   */
  async sortBy(
    option: 'az' | 'za' | 'lohi' | 'hilo'
  ): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  /**
   * Navega a la página del carrito haciendo clic en el icono de la cabecera.
   * Es la única vía de acceso al carrito desde el inventario.
   */
  async goToCart(): Promise<void> {
    await this.cartIcon.click();
  }

  /**
   * Cierra la sesión del usuario actual.
   *
   * El logout en SauceDemo requiere dos pasos: abrir el menú lateral (☰)
   * y luego hacer clic en el enlace de logout. Encapsular estos dos pasos
   * en un único método evita que los tests tengan que conocer este detalle
   * de implementación de la UI.
   */
  async logout(): Promise<void> {
    await this.burgerMenu.click();
    await this.logoutLink.click();
  }
}
