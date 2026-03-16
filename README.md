# PoC Playwright - Pruebas Funcionales

PoC de testing funcional con Playwright y TypeScript sobre [SauceDemo](https://www.saucedemo.com).

## Estructura del proyecto

```
poc_playwright/
├── src/
│   ├── pages/          # Page Object Model
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── InventoryPage.ts
│   │   ├── CartPage.ts
│   │   └── CheckoutPage.ts
│   ├── fixtures/       # Custom fixtures de Playwright
│   │   └── index.ts
│   └── data/           # Datos de prueba
│       └── users.ts
├── tests/
│   ├── auth.spec.ts        # Tests de autenticación
│   ├── inventory.spec.ts   # Tests de catálogo de productos
│   └── checkout.spec.ts    # Tests del flujo de compra
├── playwright.config.ts
└── tsconfig.json
```

## Setup

```bash
npm install
npx playwright install
```

## Ejecutar tests

```bash
# Todos los tests
npm test

# Con interfaz visual
npm run test:headed

# En modo debug (paso a paso)
npm run test:debug

# Por suite
npm run test:auth
npm run test:inventory
npm run test:checkout

# Por navegador
npm run test:chromium
npm run test:firefox

# Ver reporte HTML
npm run report
```

## Patrones usados

- **Page Object Model (POM)**: Cada página tiene su clase con locators y métodos
- **Custom Fixtures**: Extensión de `test` de Playwright para inyectar page objects
- **Authenticated Fixture**: Fixture que realiza el login antes de cada test
- **Test Data separado**: Credenciales y datos en `src/data/`
