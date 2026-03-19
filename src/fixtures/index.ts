/**
 * FIXTURES — Sistema de inyección de dependencias de Playwright
 * --------------------------------------------------------------
 * En Playwright, los "fixtures" son la forma de compartir objetos y estado
 * entre tests de forma limpia y declarativa. Funcionan como un sistema de
 * inyección de dependencias (DI): cada test declara qué necesita en sus
 * parámetros y Playwright se encarga de crearlo, proporcionarlo y destruirlo.
 *
 * ¿Por qué fixtures en lugar de instanciar los Page Objects en cada test?
 * Si cada test hiciera `const loginPage = new LoginPage(page)`, estaríamos
 * repitiendo ese boilerplate en decenas de tests. Los fixtures centralizan
 * esa creación en un único lugar.
 *
 * Este fichero define dos variantes del objeto `test`:
 *
 *   · `test`              → Para tests que gestionan el login ellos mismos
 *                           (ej: la suite de autenticación, que necesita
 *                           testar el propio proceso de login).
 *
 *   · `authenticatedTest` → Para tests que ASUMEN que el usuario ya está
 *                           autenticado. El fixture realiza el login como
 *                           parte del setup, antes de que el test empiece.
 *                           Así los tests de inventario o checkout pueden
 *                           centrarse en su funcionalidad real.
 *
 * Ambos exportan `expect` para que los ficheros de test sólo necesiten
 * un único import desde este módulo.
 */

import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { users } from '../data/users';

/**
 * Tipo que describe el conjunto de Page Objects disponibles como fixtures.
 * Al tipar el extend con `Pages`, TypeScript infiere los tipos de los
 * parámetros en los tests automáticamente — el IDE ofrece autocompletado
 * y detecta errores de tipo sin configuración adicional.
 */
type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

/**
 * Fixture base — sin autenticación previa.
 *
 * Proporciona todos los Page Objects inicializados pero sin ninguna
 * acción de navegación o login por adelantado. El test es responsable
 * de hacer goto() y login() cuando los necesite.
 *
 * Uso típico: tests de autenticación (auth.spec.ts), donde el propio
 * login es lo que se está verificando.
 *
 * El patrón `async ({ page }, use) => { await use(new XxxPage(page)); }`
 * es la firma estándar de un fixture de Playwright:
 *   - `page` es el fixture built-in de Playwright (instancia del navegador).
 *   - `use(value)` es la función que "entrega" el fixture al test.
 *   - Todo lo que va antes de `use()` es setup; lo que iría después sería teardown.
 */
export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

/**
 * Fixture autenticado — realiza el login antes de entregar los Page Objects.
 *
 * Para los tests de inventario y checkout, el login es una PRECONDICIÓN,
 * no el comportamiento bajo prueba. Incluir el login en el fixture evita
 * que cada test tenga que repetir los pasos de autenticación, lo que
 * reduciría la legibilidad y acoplaría innecesariamente esos tests
 * a los detalles de la pantalla de login.
 *
 * Se usa `users.standard` porque es el único usuario que tiene acceso
 * completo y sin anomalías a todo el flujo de la aplicación.
 *
 * Nótese que `checkoutPage` no realiza login propio: CheckoutPage es una
 * página a la que sólo se llega desde CartPage, nunca directamente.
 * El login lo realiza el fixture de `inventoryPage` o `cartPage`, que
 * son los puntos de entrada reales del flujo autenticado.
 */
export const authenticatedTest = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    // loginPage se expone igualmente por consistencia de la interfaz,
    // aunque en los tests autenticados raramente se usa directamente.
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    // Setup: navegar al login y autenticarse antes de que el test empiece.
    // El test recibirá inventoryPage ya con la sesión activa y en la URL correcta.
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    // CartPage también requiere sesión activa porque sólo es accesible
    // para usuarios autenticados. Se autentica aquí por si algún test
    // usa cartPage como fixture de entrada directo.
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    // CheckoutPage no navega por sí sola: siempre se accede a ella
    // desde CartPage. El test que use checkoutPage también usará
    // inventoryPage o cartPage, que ya habrán realizado el login.
    await use(new CheckoutPage(page));
  },
});

/**
 * Re-exportamos `expect` desde el mismo módulo para que los ficheros de test
 * puedan obtener tanto `test`/`authenticatedTest` como `expect` con un único
 * import. Si importaran `expect` directamente de '@playwright/test', seguiría
 * funcionando, pero tener todo desde el mismo punto de entrada es más limpio.
 */
export { expect } from '@playwright/test';
