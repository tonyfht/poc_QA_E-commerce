/**
 * DEMO — ejecutar tests y abrir el informe Allure con un solo comando
 * --------------------------------------------------------------------
 * Uso:  npm run demo                      (todos los navegadores)
 *       npm run demo -- --project=chromium (argumentos extra para Playwright)
 *       npm run demo:fail                 (incluye un fallo provocado, ver
 *                                          tests/demo-failure.spec.ts)
 *
 * ¿Por qué un script y no `npm test && npm run allure:report`?
 * Con `&&`, si un solo test falla la cadena se corta y el informe nunca
 * se genera — justo cuando más interesa verlo. Aquí el informe se genera
 * y abre SIEMPRE, y al final se devuelve el código de salida de los tests.
 *
 * Requisito: Java (JVM) instalado — allure-commandline lo necesita para
 * generar y servir el informe.
 */

const { spawnSync } = require('child_process');

const run = (cmd) => spawnSync(cmd, { stdio: 'inherit', shell: true }).status;

const args = process.argv.slice(2);

// --fail activa el test que falla a propósito. Se pasa como variable de
// entorno (los procesos hijos la heredan) para que funcione igual en
// Windows, macOS y Linux sin herramientas extra como cross-env.
if (args.includes('--fail')) process.env.DEMO_FAIL = '1';
const extraArgs = args.filter((arg) => arg !== '--fail').join(' ');

// `npm test` dispara antes `pretest` (limpieza + histórico de Allure)
const testStatus = run(`npm test -- ${extraArgs}`);

if (run('npm run allure:generate') !== 0) {
  console.error('No se pudo generar el informe Allure. ¿Está Java instalado?');
  process.exit(1);
}

// allure open levanta un servidor local y queda en marcha hasta Ctrl+C
run('npm run allure:open');

process.exit(testStatus ?? 1);
