# PoC Playwright - Pruebas Funcionales

[![Playwright Tests](https://github.com/tonyfht/poc_playwright/actions/workflows/tests.yml/badge.svg)](https://github.com/tonyfht/poc_playwright/actions/workflows/tests.yml)

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

---

## Requisitos previos

Antes de empezar necesitas tener instalado:

- [Node.js](https://nodejs.org) (versión 18 o superior)
- [Git](https://git-scm.com)
- [Java](https://adoptium.net) (necesario para los reportes Allure)

Verifica que están instalados correctamente:

```bash
node -v
git -v
java -version
```

---

## Configurar Git con tu cuenta de GitHub

### 1. Configurar identidad

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

> El email debe ser el mismo que usas en GitHub.

### 2. Autenticación con SSH (recomendado)

```bash
# Generar clave SSH
ssh-keygen -t ed25519 -C "tu@email.com"

# Copiar la clave pública
cat ~/.ssh/id_ed25519.pub
```

Luego en GitHub → **Settings → SSH and GPG keys → New SSH key** → pega el contenido.

Verifica que funciona:

```bash
ssh -T git@github.com
# Debe responder: Hi <usuario>! You've successfully authenticated...
```

---

## Clonar el proyecto

### 1. Navegar a tu carpeta de proyectos

```bash
# En Git Bash (usa / en lugar de \)
cd "C:/Users/Toni/Desktop/Proyectos código"

# En PowerShell
cd "C:\Users\Toni\Desktop\Proyectos código"
```

### 2. Clonar el repositorio

```bash
git clone git@github.com:usuario/poc_playwright.git
```

### 3. Entrar al proyecto

```bash
cd poc_playwright
```

---

## Setup

> **Importante:** Cada vez que clones un proyecto hay que instalar las dependencias,
> ya que la carpeta `node_modules` no se sube a Git.

```bash
npm install
npx playwright install
```

- `npm install` → descarga todas las dependencias del proyecto
- `npx playwright install` → descarga los navegadores (Chromium, Firefox, etc.)

---

## Ejecutar tests

```bash
# Todos los tests
npm test

# Con interfaz visual (navegador visible)
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
```

---

## Reportes

### Reporte Playwright (básico)

```bash
npm run report
```

### Reporte Allure (completo)

```bash
# Generar y abrir en un solo comando
npm run allure:report

# O por separado:
npm run allure:generate   # genera el reporte
npm run allure:open       # abre en el navegador
```

---

## Flujo de trabajo habitual

```bash
cd "C:/Users/Toni/Desktop/Proyectos código/poc_playwright"
npm test
npm run allure:report
```

---

## CI/CD con GitHub Actions

El proyecto incluye un workflow en `.github/workflows/tests.yml` que se ejecuta automáticamente.

### Cuándo se dispara

| Evento | Condición |
|:-------|:----------|
| `pull_request` | Cuando se modifican ficheros en `tests/**` o `src/**` |
| `workflow_dispatch` | Ejecución manual desde GitHub Actions |

### Ejecución manual (workflow_dispatch)

Desde **GitHub → Actions → Playwright Tests → Run workflow** puedes elegir:

- **Navegador:** `all` (por defecto), `chromium`, `firefox`, `mobile-chrome`
- **Entorno:** `production`

### Qué hace el workflow

```
1. Checkout del código
2. Instala Node.js 20
3. Cache de node_modules  (clave: hash de package-lock.json)
4. npm ci
5. Cache de navegadores Playwright  (~/.cache/ms-playwright)
6. npx playwright install --with-deps
7. Ejecuta cada suite por separado (continue-on-error):
   - tests/auth.spec.ts
   - tests/inventory.spec.ts
   - tests/checkout.spec.ts
8. Genera el reporte Allure  (if: always)
9. Sube artefactos:
   - allure-report  (30 días)
   - playwright-report  (7 días)
10. Escribe resumen con estado por suite en el PR
11. Falla el job si alguna suite falló
```

### Resumen en el PR

Tras cada ejecución verás una tabla como esta en el apartado **Summary** del workflow:

| Suite | Estado |
|:------|:------:|
| Authentication | ✅ `success` |
| Inventory | ✅ `success` |
| Checkout | ❌ `failure` |

### Descargar el reporte Allure

1. Abre la ejecución del workflow en GitHub Actions
2. Baja hasta la sección **Artifacts**
3. Descarga `allure-report`
4. Descomprime y abre `index.html` en el navegador

---

## Patrones usados

- **Page Object Model (POM)**: Cada página tiene su clase con locators y métodos
- **Custom Fixtures**: Extensión de `test` de Playwright para inyectar page objects
- **Authenticated Fixture**: Fixture que realiza el login antes de cada test
- **Test Data separado**: Credenciales y datos en `src/data/`
