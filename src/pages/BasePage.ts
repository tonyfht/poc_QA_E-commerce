/**
 * CLASE BASE — BasePage (Page Object Model)
 * ------------------------------------------
 * En el patrón Page Object Model (POM), cada página o sección significativa
 * de la aplicación se representa como una clase. Esta clase abstracta actúa
 * como la raíz de la jerarquía: centraliza la instancia de `Page` de Playwright
 * y proporciona operaciones comunes a todas las páginas.
 *
 * ¿Por qué una clase abstracta y no una interfaz o una clase normal?
 * - No tiene sentido instanciar "una página genérica"; siempre trabajamos con
 *   páginas concretas (login, catálogo, carrito...). `abstract` impone ese contrato.
 * - Al ser clase (y no interfaz), puede contener implementación real de métodos,
 *   evitando repetir el mismo código en cada subclase.
 *
 * La instancia de `Page` se declara `readonly` (pública):
 * - `readonly`: nadie puede reasignar la referencia a la página una vez creada.
 * - Pública: los tests la necesitan para aserciones a nivel de página como
 *   `expect(inventoryPage.page).toHaveURL(...)`. Si fuera `protected`,
 *   TypeScript rechazaría ese acceso (error TS2445 en `tsc --noEmit`).
 */

import { Page, test } from '@playwright/test';

export abstract class BasePage {
  /**
   * @param page - Instancia de Page de Playwright inyectada por el fixture.
   * Playwright gestiona el ciclo de vida del browser/context/page; nosotros
   * simplemente recibimos la instancia lista para usar.
   */
  constructor(readonly page: Page) {}

  /**
   * Agrupa varias acciones bajo un PASO DE NEGOCIO con nombre legible.
   *
   * Sin pasos, el informe (Playwright y Allure) muestra una lista plana de
   * acciones técnicas: "fill [data-test=username]", "click [data-test=...]".
   * Con pasos, muestra el flujo tal como lo contaría una persona:
   *   ▸ Login como "standard_user"
   *   ▸ Añadir "Sauce Labs Backpack" al carrito
   *   ▸ Ir al carrito
   *
   * `box: true` hace que, si algo falla dentro del paso, el error se señale
   * en la línea del TEST que llamó al Page Object, no dentro de esta clase:
   * es donde quien lee el informe quiere mirar.
   */
  protected step<T>(title: string, body: () => Promise<T>): Promise<T> {
    return test.step(title, body, { box: true });
  }

  /**
   * Navega a una ruta relativa dentro de la aplicación.
   *
   * No se usa directamente en los tests; cada subclase define su propio
   * método `goto()` que llama a éste con la ruta correcta. Así el test
   * sólo necesita llamar a `loginPage.goto()` sin conocer la URL.
   *
   * @param path - Ruta relativa (p. ej. '/', '/inventory.html').
   *               Se combina con la `baseURL` configurada en playwright.config.ts.
   */
  async navigate(path: string = ''): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Devuelve el título de la pestaña del navegador.
   * Útil para aserciones rápidas que verifican que se ha llegado
   * a la página correcta cuando la URL no es suficientemente descriptiva.
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }
}
