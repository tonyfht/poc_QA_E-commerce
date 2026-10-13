// ESLint — análisis estático del código de tests.
//
// eslint-plugin-playwright detecta errores típicos de Playwright que el
// compilador de TypeScript no ve, por ejemplo:
//   - olvidar un `await` delante de una acción o aserción (test que "pasa" sin comprobar nada)
//   - dejar un `test.only` o un `page.pause()` olvidado
//   - usar `waitForTimeout` (esperas fijas) en lugar de aserciones web-first
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'allure-results/',
      'allure-report/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { require: 'readonly', process: 'readonly', __dirname: 'readonly', console: 'readonly' },
    },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    // `authenticatedTest` es un `test` extendido: el plugin debe tratarlo igual
    settings: { playwright: { globalAliases: { test: ['authenticatedTest'] } } },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Las aserciones viven en los tests pero las acciones en los Page Objects:
      // la regla no ve los expect dentro de helpers como expectNoAccessibilityViolations.
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expectNoAccessibilityViolations'] },
      ],
    },
  }
);
