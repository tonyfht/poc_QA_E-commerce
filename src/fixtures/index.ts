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
 *                           autenticado. Cada test arranca con la sesión
 *                           activa y en el catálogo, sin pasar por el login.
 *
 * Ambos exportan `expect` para que los ficheros de test sólo necesiten
 * un único import desde este módulo.
 */

import { BrowserContext, test as base } from '@playwright/test';
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

/** Credenciales de cualquiera de los usuarios de src/data/users.ts. */
export type UserCredentials = { readonly username: string; readonly password: string };

/** Cookies + localStorage de una sesión, tal como los devuelve Playwright. */
type SessionState = Awaited<ReturnType<BrowserContext['storageState']>>;

/**
 * Fixtures de ámbito WORKER (un worker = un proceso que ejecuta varios tests).
 *
 *   · `user`         → OPCIÓN configurable por fichero de test:
 *                        authenticatedTest.use({ user: users.problem });
 *                      Por defecto, `users.standard`.
 *
 *   · `sessionState` → Sesión ya iniciada con ese usuario. Se crea UNA vez
 *                      por worker y se reutiliza en todos sus tests.
 */
type WorkerFixtures = {
  user: UserCredentials;
  sessionState: SessionState;
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
 * Fixture autenticado — los tests arrancan con sesión iniciada y en el catálogo.
 *
 * Para los tests de inventario y checkout, el login es una PRECONDICIÓN,
 * no el comportamiento bajo prueba.
 *
 * ESTRATEGIA: login una vez por worker + storageState
 * ----------------------------------------------------
 * Hacer login por la UI antes de CADA test es lento y repetitivo. En su lugar:
 *
 *   1. `sessionState` (worker) abre un contexto aparte, hace login UNA vez
 *      y captura cookies + localStorage con `context.storageState()`.
 *   2. Se sobrescribe el fixture built-in `storageState` para que cada test
 *      cree su navegador ya con esa sesión cargada.
 *   3. `inventoryPage` sólo navega a /inventory.html: no hay login por test.
 *
 * Cada test sigue teniendo su propio contexto aislado (su propio carrito),
 * sólo comparten el punto de partida: "usuario autenticado".
 *
 * La sesión se guarda en memoria (no en fichero) a propósito: SauceDemo
 * caduca la cookie a los 10 minutos, así que reutilizarla entre ejecuciones
 * provocaría fallos difíciles de entender.
 */
export const authenticatedTest = test.extend<object, WorkerFixtures>({
  user: [users.standard, { option: true, scope: 'worker' }],

  sessionState: [
    async ({ browser, user }, use, workerInfo) => {
      const context = await browser.newContext({
        baseURL: workerInfo.project.use.baseURL,
      });
      const page = await context.newPage();
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(user.username, user.password);
      await page.waitForURL(/inventory\.html/);
      const state = await context.storageState();
      await context.close();
      await use(state);
    },
    { scope: 'worker' },
  ],

  storageState: async ({ sessionState }, use) => {
    await use(sessionState);
  },

  inventoryPage: async ({ page }, use) => {
    // El test recibe inventoryPage ya en la URL correcta y con sesión activa.
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
    await use(inventoryPage);
  },
});

/**
 * Re-exportamos `expect` desde el mismo módulo para que los ficheros de test
 * puedan obtener tanto `test`/`authenticatedTest` como `expect` con un único
 * import. Si importaran `expect` directamente de '@playwright/test', seguiría
 * funcionando, pero tener todo desde el mismo punto de entrada es más limpio.
 */
export { expect } from '@playwright/test';
