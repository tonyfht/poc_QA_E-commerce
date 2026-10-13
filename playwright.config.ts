import { defineConfig, devices } from '@playwright/test';
import * as os from 'os';

const baseURL = 'https://www.saucedemo.com';

/**
 * URL de tu Jira/TMS. Los tests sólo indican la clave (p. ej. allure.issue('DEMO-101'))
 * y Allure construye el enlace con esta plantilla. Configurable por entorno:
 *   JIRA_BASE_URL=https://miempresa.atlassian.net npm run demo
 */
const jiraBaseURL = process.env.JIRA_BASE_URL ?? 'https://your-company.atlassian.net';

/** Fallos con categoría propia: se excluyen de las categorías genéricas. */
const SPECIFIC = '.*(toHaveScreenshot|Violaciones de accesibilidad|Presupuesto de rendimiento)';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',

        // Widget "Environment" del Overview de Allure
        environmentInfo: {
          'Base URL': baseURL,
          'Sistema operativo': `${os.type()} ${os.release()}`,
          'Node.js': process.version,
          // Claves sin tildes: Allure 2 lee environment.properties como Latin-1
          Origen: process.env.CI ? 'GitHub Actions' : 'Local',
        },

        // Plantillas de enlace: el test indica la clave y Allure construye la URL
        links: {
          issue: {
            urlTemplate: `${jiraBaseURL}/browse/%s`,
            nameTemplate: 'Bug %s',
          },
          tms: {
            urlTemplate: `${jiraBaseURL}/browse/%s`,
            nameTemplate: 'Caso %s',
          },
        },

        // Pestaña "Categories": clasifica los fallos por causa.
        //
        // OJO: Allure mete un fallo en TODAS las categorías cuyo patrón encaje,
        // no sólo en la primera. Y los mensajes de Playwright siempre incluyen
        // "Timeout" y "waiting for locator" (las aserciones reintentan), así que
        // los patrones usan lookaheads negativos (?!...) para ser excluyentes.
        // (?s) hace que `.` cruce saltos de línea: los mensajes son multilínea.
        //
        // Los defectos conocidos (test.fail) no aparecen aquí: para Allure son
        // tests superados. Se agrupan en Behaviors → "Defectos conocidos".
        categories: [
          {
            name: 'Regresión visual',
            messageRegex: '(?s).*toHaveScreenshot.*',
            matchedStatuses: ['failed'],
          },
          {
            name: 'Violaciones de accesibilidad',
            messageRegex: '(?s).*Violaciones de accesibilidad.*',
            matchedStatuses: ['failed'],
          },
          {
            name: 'Presupuesto de rendimiento superado',
            messageRegex: '(?s).*Presupuesto de rendimiento.*',
            matchedStatuses: ['failed'],
          },
          {
            name: 'Elemento no encontrado / selector roto',
            messageRegex: String.raw`(?s)(?!${SPECIFIC}).*(element\(s\) not found|locator\.\w+: Timeout|strict mode violation).*`,
            matchedStatuses: ['failed', 'broken'],
          },
          {
            name: 'Defectos del producto (resultado inesperado)',
            messageRegex: String.raw`(?s)Error: expect(?!${SPECIFIC}|.*element\(s\) not found|.*strict mode violation).*`,
            matchedStatuses: ['failed'],
          },
          {
            name: 'Test demasiado lento (timeout global)',
            messageRegex: '(?s)Test timeout of.*',
            matchedStatuses: ['failed', 'broken'],
          },
          {
            name: 'Defectos del test (error de código)',
            matchedStatuses: ['broken'],
          },
        ],
      },
    ],
    ['list'],
  ],
  use: {
    baseURL,
    // Traza (timeline + DOM + red) adjunta a CADA test fallido, también en local
    // donde no hay reintentos. Se abre desde Allure o con `npx playwright show-trace`.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Regresión visual: tolera diferencias mínimas de antialiasing entre ejecuciones
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
