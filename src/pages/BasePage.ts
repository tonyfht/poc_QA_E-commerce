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
 * La instancia de `Page` se declara `protected readonly`:
 * - `protected`: las subclases pueden acceder a `this.page` sin exponerlo públicamente.
 * - `readonly`: nadie puede reasignar la referencia a la página una vez creada.
 */

import { Page } from '@playwright/test';

export abstract class BasePage {
  /**
   * @param page - Instancia de Page de Playwright inyectada por el fixture.
   * Playwright gestiona el ciclo de vida del browser/context/page; nosotros
   * simplemente recibimos la instancia lista para usar.
   */
  constructor(protected readonly page: Page) {}

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
   * Espera a que la página esté completamente cargada.
   *
   * 'networkidle' significa que no hay peticiones de red activas durante
   * al menos 500 ms. Es más robusto que 'load' (sólo espera el evento DOMContentLoaded)
   * o 'domcontentloaded' cuando la página hace peticiones asíncronas post-carga.
   *
   * Uso típico: después de una navegación que desencadena llamadas a APIs.
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
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
