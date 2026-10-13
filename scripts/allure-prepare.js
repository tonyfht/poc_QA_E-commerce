/**
 * PREPARACIÓN DE ALLURE — se ejecuta automáticamente antes de `npm test`
 * -----------------------------------------------------------------------
 * allure-playwright AÑADE resultados a allure-results/ en cada ejecución,
 * nunca los borra. Sin esta limpieza, el informe mezclaría tests de
 * ejecuciones antiguas con los de la actual.
 *
 * Pasos:
 *   1. Vaciar allure-results/ (resultados de la ejecución anterior).
 *   2. Copiar allure-report/history/ → allure-results/history/.
 *      Allure lee esa carpeta al generar el informe y la usa para pintar
 *      la gráfica de tendencia (Trend) con las ejecuciones previas.
 *
 * Es el mismo mecanismo que usa el workflow de CI con la rama gh-pages,
 * pero en local la "memoria" es la carpeta allure-report/ del disco.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const resultsDir = path.join(root, 'allure-results');
const previousHistory = path.join(root, 'allure-report', 'history');

fs.rmSync(resultsDir, { recursive: true, force: true });
fs.mkdirSync(resultsDir, { recursive: true });

if (fs.existsSync(previousHistory)) {
  fs.cpSync(previousHistory, path.join(resultsDir, 'history'), {
    recursive: true,
  });
  console.log('Allure: histórico anterior restaurado (gráfica de tendencia)');
} else {
  console.log('Allure: sin histórico previo — primera ejecución');
}
