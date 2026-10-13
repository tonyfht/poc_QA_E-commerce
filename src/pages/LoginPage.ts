/**
 * PAGE OBJECT — LoginPage
 * ------------------------
 * Representa la página de inicio de sesión de SauceDemo (ruta raíz '/').
 * Encapsula todos los locators y acciones relacionados con la autenticación,
 * de modo que los tests no necesitan conocer ningún detalle del DOM.
 *
 * Principio clave del POM: si la aplicación cambia el selector de un campo,
 * sólo hay que actualizar este fichero, no todos los tests que usan la pantalla
 * de login.
 *
 * Extiende BasePage para heredar la instancia de `page` y los métodos comunes.
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  /**
   * ESTRATEGIA DE LOCALIZACIÓN — atributos data-test
   * -------------------------------------------------
   * Todos los locators de esta página usan el atributo `data-test="..."`.
   * Esta es la estrategia más robusta disponible en SauceDemo porque:
   *
   *   - Es inmune a cambios de estilos CSS (si se renombra una clase, el test sigue funcionando).
   *   - Es inmune a cambios estructurales del HTML (si se añade un div wrapper, no afecta).
   *   - Su propósito es explícitamente el testing, por lo que el equipo de desarrollo
   *     sabe que no debe eliminarlo sin coordinación.
   *
   * Alternativas menos robustas que deliberadamente evitamos:
   *   - page.locator('.login_field')  → frágil si se refactoriza el CSS
   *   - page.locator('input[type=text]') → frágil si se añaden más inputs
   *   - page.getByPlaceholder('Username') → dependiente del texto, frágil ante i18n
   */
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;

  /**
   * Locator del mensaje de error que aparece cuando el login falla.
   * SauceDemo muestra un único elemento de error para todos los casos
   * (credenciales inválidas, usuario bloqueado, campos vacíos), por lo que
   * un único locator cubre todos los escenarios de error.
   *
   * Es público para que los tests usen aserciones web-first, que reintentan
   * hasta que el mensaje aparece:
   *   await expect(loginPage.errorMessage).toContainText('locked out');
   * Leer `isVisible()` / `innerText()` y comparar después toma una foto
   * instantánea: si el error tarda unos milisegundos en pintarse, falla.
   */
  readonly errorMessage: Locator;

  /**
   * Los locators se inicializan en el constructor, no en cada método.
   * Playwright evalúa los locators de forma lazy (en el momento de la interacción),
   * así que definirlos aquí no supone ninguna llamada al navegador todavía —
   * simplemente se almacena la "promesa" de encontrar ese elemento cuando se necesite.
   *
   * @param page - Instancia de Page proporcionada por el fixture de Playwright.
   */
  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  /**
   * Navega a la pantalla de login.
   * La ruta '/' es la raíz de la aplicación, que SauceDemo sirve como login.
   * Se combina con la `baseURL` definida en playwright.config.ts, así que
   * cambiar el entorno de pruebas sólo requiere modificar la configuración,
   * no este método.
   */
  async goto(): Promise<void> {
    await this.step('Abrir la pantalla de login', () => this.navigate('/'));
  }

  /**
   * Realiza el proceso completo de inicio de sesión.
   *
   * Usa `fill()` en lugar de `type()` para rellenar los campos.
   * La diferencia es relevante: `fill()` establece el valor directamente
   * (equivale a un pegado de texto), mientras que `type()` simula pulsación
   * tecla a tecla. `fill()` es más rápido y apropiado cuando no se están
   * testando eventos de teclado específicos.
   *
   * Este método no hace ninguna aserción — sólo interactúa.
   * La verificación de si el login fue exitoso o no corresponde al test.
   *
   * @param username - Nombre de usuario (ver src/data/users.ts).
   * @param password - Contraseña correspondiente al usuario.
   */
  async login(username: string, password: string): Promise<void> {
    await this.step(`Login como "${username || '(vacío)'}"`, async () => {
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
      await this.loginButton.click();
    });
  }
}
