/**
 * PAGE OBJECT — CheckoutPage
 * ---------------------------
 * Representa el flujo de checkout de SauceDemo, que consta de tres pasos:
 *
 *   Paso 1 (/checkout-step-one.html)  → Formulario de datos de envío
 *   Paso 2 (/checkout-step-two.html)  → Resumen del pedido con total
 *   Paso 3 (/checkout-complete.html)  → Confirmación de compra completada
 *
 * Un único Page Object cubre los tres pasos porque todos forman parte del
 * mismo flujo funcional y el usuario nunca sale de ellos sin completar
 * o cancelar el proceso. Dividirlo en tres clases añadiría complejidad
 * sin aportar claridad adicional dado el scope de esta PoC.
 *
 * La interfaz CheckoutInfo separa el contrato de datos del Page Object,
 * lo que facilita añadir nuevos conjuntos de datos de prueba en users.ts
 * sin modificar esta clase.
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Contrato de datos para el formulario de información de envío (Paso 1).
 * Definir una interfaz en lugar de pasar parámetros sueltos tiene dos ventajas:
 *   - El test expresa la intención completa en una sola variable (checkoutData.valid).
 *   - TypeScript verifica en compilación que no falta ningún campo requerido.
 */
export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutPage extends BasePage {
  /**
   * PASO 1 — Campos del formulario de envío.
   * Todos usan data-test, que SauceDemo provee consistentemente
   * para los inputs de formulario. Nótese que los valores son
   * camelCase en data-test ('firstName') a diferencia de otros
   * elementos que usan kebab-case.
   */
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly postalCodeInput: Locator;

  /** Botón "Continue" del Paso 1: valida el formulario y avanza al Paso 2. */
  private readonly continueButton: Locator;

  /** Botón "Finish" del Paso 2: confirma el pedido y navega a la confirmación. */
  private readonly finishButton: Locator;

  /**
   * PASO 3 — Cabecera del mensaje de confirmación.
   * ESTRATEGIA: usa selector de clase CSS porque este elemento
   * no tiene atributo data-test en SauceDemo. La clase '.complete-header'
   * es semánticamente descriptiva y estable.
   */
  private readonly confirmationHeader: Locator;

  /**
   * PASO 2 — Etiqueta con el total del pedido.
   * También usa clase CSS por ausencia de data-test.
   * Contiene el precio total con impuestos en formato texto
   * (p. ej. 'Total: $43.18'), que el test puede verificar
   * comprobando que incluye la cadena 'Total:'.
   */
  private readonly totalLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.confirmationHeader = page.locator('.complete-header');
    this.totalLabel = page.locator('.summary_total_label');
  }

  /**
   * Rellena el formulario de datos de envío (Paso 1 del checkout).
   *
   * Recibe un objeto CheckoutInfo en lugar de tres parámetros independientes
   * para que el test pueda reutilizar los datos definidos en el dataset
   * (checkoutData.valid) sin desestructurar manualmente.
   *
   * @param info - Datos de envío: nombre, apellido y código postal.
   */
  async fillCheckoutInfo(info: CheckoutInfo): Promise<void> {
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.postalCodeInput.fill(info.postalCode);
  }

  /**
   * Hace clic en "Continue" al final del Paso 1.
   * SauceDemo valida aquí que los tres campos están rellenos.
   * Si la validación falla, permanece en Paso 1 y muestra un error.
   * Si tiene éxito, navega a '/checkout-step-two.html'.
   */
  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Hace clic en "Finish" al final del Paso 2 para confirmar el pedido.
   * Este es el punto de no retorno del flujo: simula la confirmación definitiva
   * de la compra. Navega a '/checkout-complete.html'.
   */
  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  /**
   * Devuelve el mensaje de confirmación de la pantalla final (Paso 3).
   * SauceDemo muestra siempre el mismo texto: 'Thank you for your order!'
   * El test compara contra este valor exacto para verificar que el flujo
   * completo terminó correctamente.
   */
  async getConfirmationMessage(): Promise<string> {
    return this.confirmationHeader.innerText();
  }

  /**
   * Devuelve el texto del total del pedido en el Paso 2.
   * El formato es 'Total: $XX.XX' (incluye subtotal + tax).
   * El test verifica que contiene 'Total:' en lugar del valor numérico exacto,
   * porque los precios de SauceDemo podrían variar y lo importante es que
   * el resumen muestra el total, no el importe concreto.
   */
  async getTotal(): Promise<string> {
    return this.totalLabel.innerText();
  }
}
