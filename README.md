# POC — Automatización de Pruebas con Playwright

[![Playwright Tests](https://github.com/tonyfht/poc_QA_E-commerce/actions/workflows/tests.yml/badge.svg)](https://github.com/tonyfht/poc_QA_E-commerce/actions/workflows/tests.yml)
[![Playwright](https://img.shields.io/badge/Playwright-1.58-45ba4b?logo=playwright)](https://playwright.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Node](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org)

---

## Índice

1. [Introducción](#1-introducción)
2. [Arquitectura del proyecto](#2-arquitectura-del-proyecto)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Dataset de prueba](#4-dataset-de-prueba)
5. [Casos de prueba](#5-casos-de-prueba)
6. [Cómo ejecutar](#6-cómo-ejecutar)
7. [Reporte Allure](#7-reporte-allure)
8. [Integración continua con GitHub Actions](#8-integración-continua-con-github-actions)
9. [Próximos pasos / Roadmap](#9-próximos-pasos--roadmap)

---

## 1. Introducción

Esta **Prueba de Concepto (PoC)** demuestra la implementación de una suite de automatización de pruebas funcionales end-to-end utilizando **Playwright** y **TypeScript** sobre la aplicación de referencia [SauceDemo](https://www.saucedemo.com).

### ¿Qué es SauceDemo?

SauceDemo es una aplicación web de e-commerce desarrollada específicamente para fines de testing. Simula una tienda online completa con pantalla de login, catálogo de productos, carrito de compra y flujo de checkout. Su diseño intencionado incluye distintos perfiles de usuario que reproducen escenarios reales: acceso normal, cuentas bloqueadas, UI con defectos o degradación de rendimiento.

### ¿Qué demuestra esta PoC?

| Capacidad | Detalle |
|:---|:---|
| **Diseño de arquitectura de tests** | Implementación del patrón Page Object Model (POM) con jerarquía de clases y separación de responsabilidades |
| **Cobertura multi-navegador** | Ejecución simultánea en Chrome, Firefox y Chrome Mobile (Pixel 5) |
| **Gestión de contexto de prueba** | Sistema de fixtures para inyección de dependencias y pre-autenticación |
| **Estrategia de localización** | Uso prioritario de atributos `data-test` para máxima resiliencia ante cambios de UI |
| **Reporting profesional** | Informe Allure con pasos de negocio, metadatos (epic/feature/story/severity), enlaces a Jira, categorías de fallo, entorno, historial, trazas, capturas y vídeos |
| **Calidad más allá de lo funcional** | Regresión visual, accesibilidad WCAG 2.1 AA (axe-core) y presupuesto de rendimiento |
| **Gestión de defectos conocidos** | Bugs reportados marcados con `test.fail()` y enlazados a su ticket |
| **Integración continua** | Workflow de GitHub Actions con caché, ejecución por suites y artefactos |
| **Tipado estático y lint** | TypeScript estricto (`npm run typecheck`) y ESLint con `eslint-plugin-playwright` (`npm run lint`) |

La suite contiene **28 casos de prueba** distribuidos en **8 suites** sobre **3 navegadores** (**84 ejecuciones**). Uno de ellos es el fallo provocado para la demo, que sólo se ejecuta con `npm run demo:fail`.

---

## 2. Arquitectura del proyecto

```
poc_QA_E-commerce/
│
├── src/                            # Código de soporte — no contiene tests
│   │
│   ├── pages/                      # Page Objects (patrón POM)
│   │   │                           # Cada clase modela una pantalla de la aplicación.
│   │   │                           # Los tests nunca tocan el DOM directamente.
│   │   │
│   │   ├── BasePage.ts             # Clase abstracta raíz: instancia de Page y métodos comunes
│   │   ├── LoginPage.ts            # Pantalla de login: locators y acciones de autenticación
│   │   ├── InventoryPage.ts        # Catálogo de productos: carrito, ordenación, menú
│   │   ├── CartPage.ts             # Página del carrito: revisión y navegación al checkout
│   │   └── CheckoutPage.ts        # Flujo de compra (3 pasos): formulario, resumen, confirmación
│   │
│   ├── fixtures/
│   │   └── index.ts                # Sistema DI de Playwright: inyecta Page Objects en los tests.
│   │                               # Define dos variantes: sin autenticación y pre-autenticada
│   │                               # (login una vez por worker + storageState).
│   │
│   └── data/
│       └── users.ts                # Dataset centralizado: credenciales y datos de formulario.
│                                   # Separa los datos del código de prueba.
│
├── tests/                          # Suites de tests — un fichero por área funcional
│   ├── auth.spec.ts                # Autenticación, con casos guiados por datos (6 casos)
│   ├── inventory.spec.ts           # Catálogo de productos (8 casos)
│   ├── checkout.spec.ts            # Carrito y flujo de compra (4 casos)
│   ├── known-issues.spec.ts        # Defectos conocidos de problem_user (2 casos)
│   ├── performance.spec.ts         # Presupuesto de rendimiento del login (2 casos)
│   ├── accessibility.spec.ts       # Accesibilidad WCAG 2.1 AA con axe-core (3 casos)
│   ├── visual.spec.ts              # Regresión visual con capturas de referencia (2 casos)
│   ├── visual.spec.ts-snapshots/   # Capturas de referencia (por navegador y SO)
│   └── demo-failure.spec.ts        # Fallo provocado para la demo (sólo con DEMO_FAIL=1)
│
├── scripts/
│   ├── allure-prepare.js           # Antes de `npm test`: limpia resultados y conserva el histórico
│   └── demo.js                     # `npm run demo`: tests + informe Allure en un solo comando
│
├── .github/
│   └── workflows/
│       └── tests.yml               # Pipeline de GitHub Actions: CI completo con Allure
│
├── playwright.config.ts            # Configuración global: navegadores, reporters, base URL,
│                                   # entorno, enlaces y categorías de Allure
├── eslint.config.mjs               # Reglas de lint (TypeScript + Playwright)
├── tsconfig.json                   # Configuración de TypeScript
└── package.json                    # Dependencias y scripts npm
```

### ¿Por qué esta estructura?

La separación entre `src/` y `tests/` responde al principio de **separación de responsabilidades**:

- **`src/pages/`** — Los Page Objects son la única capa que conoce el DOM. Si la aplicación cambia un selector, sólo se modifica el Page Object correspondiente, no los tests.
- **`src/fixtures/`** — Centraliza la creación de Page Objects y la gestión del estado de sesión. Los tests declaran qué necesitan; el fixture se lo proporciona.
- **`src/data/`** — Los datos de prueba no viven en los tests. Si cambia una credencial o un conjunto de datos, se actualiza en un único lugar.
- **`tests/`** — Cada fichero de test es puramente declarativo: describe el comportamiento esperado sin detalles de implementación.

---

## 3. Stack tecnológico

| Herramienta | Versión | Rol en el proyecto |
|:---|:---:|:---|
| [Playwright](https://playwright.dev) | 1.58 | Framework principal de automatización: control de navegador, sistema de fixtures, assertions y reporters |
| [TypeScript](https://www.typescriptlang.org) | 5.9 | Tipado estático sobre JavaScript: detecta errores en compilación, mejora el autocompletado y la mantenibilidad |
| [Node.js](https://nodejs.org) | 20 LTS | Runtime de ejecución del proyecto |
| [allure-playwright](https://allurereport.org) | 3.6 | Reporter de Playwright que genera los datos fuente del informe Allure |
| [allure-commandline](https://allurereport.org) | 2.38 | CLI de Allure: transforma los datos fuente en el reporte HTML interactivo (requiere Java) |
| [allure-js-commons](https://allurereport.org) | 3.6 | API de metadatos de Allure usada en los tests: epic, feature, story, severity, issue, parameter... |
| [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm) | 4.x | Auditoría automática de accesibilidad |
| [ESLint](https://eslint.org) + [eslint-plugin-playwright](https://github.com/playwright-community/eslint-plugin-playwright) | 10.x | Análisis estático: detecta `await` olvidados, `test.only`, esperas fijas... |
| [GitHub Actions](https://docs.github.com/actions) | — | Plataforma de CI/CD: ejecuta los tests automáticamente en cada Pull Request |

### Navegadores configurados

| Proyecto | Dispositivo simulado | Resolución |
|:---|:---|:---|
| `chromium` | Desktop Chrome | 1280 × 720 |
| `firefox` | Desktop Firefox | 1280 × 720 |
| `mobile-chrome` | Pixel 5 (Android) | 393 × 851 |

---

## 4. Dataset de prueba

### Usuarios

| Usuario | Credenciales | Comportamiento en la app | Escenario cubierto |
|:---|:---|:---|:---|
| `standard_user` | `secret_sauce` | Acceso completo y flujo normal | Happy path: login, inventario, checkout |
| `locked_out_user` | `secret_sauce` | Cuenta bloqueada por política de acceso | Control de acceso: rechazo con mensaje específico |
| `problem_user` | `secret_sauce` | UI con defectos visuales y funcionales | Defectos conocidos con `test.fail()` (`known-issues.spec.ts`) |
| `performance_glitch_user` | `secret_sauce` | Latencia artificial de varios segundos | Presupuesto de rendimiento del login (`performance.spec.ts`) |

> Todos los usuarios comparten contraseña deliberadamente: esto permite aislar la variable que provoca el fallo (política de acceso, UI rota, etc.) descartando credenciales incorrectas como causa.

### Datos de formulario

| Dataset | Valores | Propósito |
|:---|:---|:---|
| `checkoutData.valid` | John / Doe / 12345 | Completar el formulario de envío sin errores de validación |

### Productos utilizados en los tests

| Producto | Usado en |
|:---|:---|
| Sauce Labs Backpack | Tests de carrito, checkout y eliminación de productos |
| Sauce Labs Bike Light | Tests de carrito múltiple y checkout |

---

## 5. Casos de prueba

### Suite: Autenticación (`auth.spec.ts`) — 6 tests

| # | Caso de prueba | Qué verifica |
|:---:|:---|:---|
| 1 | Login exitoso con credenciales válidas | La URL cambia a `/inventory.html` tras autenticarse correctamente |
| 2–5 | **Acceso denegado (data-driven)**: usuario bloqueado, credenciales inválidas, campos vacíos, contraseña vacía | Una tabla de casos genera un test por fila; cada uno comprueba su mensaje de error. Los datos de entrada aparecen como *Parameters* en Allure (contraseña enmascarada) |
| 6 | Logout exitoso | Tras cerrar sesión, la URL vuelve a `/` (pantalla de login) |

### Suite: Catálogo de productos (`inventory.spec.ts`) — 8 tests

| # | Caso de prueba | Qué verifica |
|:---:|:---|:---|
| 7 | Visualización del catálogo completo | El catálogo muestra exactamente 6 productos |
| 8 | Añadir un producto al carrito | El badge del carrito muestra 1 |
| 9 | Añadir múltiples productos | El badge acumula correctamente (valor 2) |
| 10 | Eliminar un producto del carrito | El badge desaparece al quedar el carrito vacío |
| 11 | Ordenar por precio ascendente | Cada precio es ≥ al anterior en la lista |
| 12 | Ordenar por precio descendente | Cada precio es ≤ al anterior en la lista |
| 13 | Ordenar por nombre Z→A | El orden de la UI coincide con el orden alfabético inverso |
| 14 | Ordenar por nombre A→Z | Se fuerza antes Z→A (el orden por defecto ya es A→Z) y se comprueba que vuelve a A→Z |

### Suite: Carrito y checkout (`checkout.spec.ts`) — 4 tests

| # | Caso de prueba | Qué verifica |
|:---:|:---|:---|
| 15 | Ítems correctos en el carrito | El carrito muestra 2 ítems con los nombres exactos de los productos añadidos |
| 16 | Eliminar un ítem desde el carrito | El conteo se reduce a 1 tras la eliminación |
| 17 | **Flujo de compra completo (E2E)** | Carrito → Paso 1 (datos envío) → Paso 2 (resumen) → Paso 3 (confirmación) |
| 18 | Navegación de retorno al inventario | "Continue Shopping" devuelve al catálogo desde el carrito |

### Suite: Defectos conocidos (`known-issues.spec.ts`) — 2 tests

Se ejecutan con `problem_user`. Están marcados con `test.fail()`: mientras el bug exista, el test falla y Playwright lo da por bueno. Si alguien corrige el bug, el test pasa y Playwright avisa para quitar la marca.

| # | Caso de prueba | Bug |
|:---:|:---|:---|
| 19 | Cada producto tiene su propia imagen | DEMO-101: todas las imágenes son iguales |
| 20 | Ordenar por nombre Z→A | DEMO-102: la ordenación no reordena |

### Suite: Rendimiento (`performance.spec.ts`) — 2 tests

| # | Caso de prueba | Qué verifica |
|:---:|:---|:---|
| 21 | Login de `standard_user` dentro de presupuesto | Del clic en *Login* al catálogo en menos de 3 s; el tiempo medido se adjunta como parámetro |
| 22 | Login de `performance_glitch_user` | Mismo presupuesto; tarda unos 5 s → defecto conocido DEMO-103 |

### Suite: Accesibilidad (`accessibility.spec.ts`) — 3 tests

| # | Caso de prueba | Qué verifica |
|:---:|:---|:---|
| 23–25 | Login, catálogo y carrito | Sin violaciones WCAG 2.1 A/AA según axe-core; el análisis completo se adjunta en JSON |

### Suite: Regresión visual (`visual.spec.ts`) — 2 tests

| # | Caso de prueba | Qué verifica |
|:---:|:---|:---|
| 26–27 | Login y catálogo | La captura coincide con la referencia guardada; si no, adjunta esperada / actual / diferencias |

> Las capturas de referencia dependen del sistema operativo (las fuentes se renderizan distinto). Las incluidas son de Windows, por eso esta suite no se ejecuta en el CI de Linux. Para regenerarlas: `npm run test:visual:update`.

### Fallo provocado (`demo-failure.spec.ts`) — 1 test

| # | Caso de prueba | Qué muestra |
|:---:|:---|:---|
| 28 | El badge cuenta tres productos (se añaden dos) | Cómo se ve un fallo en Allure: paso exacto, captura, vídeo, traza y categoría. Sólo se ejecuta con `npm run demo:fail` |

**Total: 28 tests × 3 navegadores = 84 ejecuciones**

---

## 6. Cómo ejecutar

### Requisitos previos

- [Node.js 18+](https://nodejs.org)
- [Java 8+](https://adoptium.net) (requerido por la CLI de Allure)
- [Git](https://git-scm.com)

```bash
# Verificar instalaciones
node -v && java -version && git -v
```

### Instalación

```bash
# 1. Clonar el repositorio
git clone git@github.com:tonyfht/poc_QA_E-commerce.git
cd poc_QA_E-commerce

# 2. Instalar dependencias de Node
npm install

# 3. Descargar navegadores de Playwright
npx playwright install
```

> `node_modules/` no se incluye en el repositorio. Este paso es obligatorio tras cada clonado.

---

### Demo: tests + informe en un solo comando

```bash
# Ejecuta los tests y, aunque alguno falle, genera y abre el informe Allure
npm run demo

# Sólo Chromium (más rápido)
npm run demo -- --project=chromium

# Incluyendo el fallo provocado, para enseñar cómo se ve un error
npm run demo:fail
```

`allure open` deja un servidor local en marcha hasta pulsar `Ctrl+C`. No abras `allure-report/index.html` con doble clic: sin servidor, el informe sale en blanco.

Antes de cada `npm test` se ejecuta `scripts/allure-prepare.js`, que vacía `allure-results/` (para no mezclar ejecuciones) y copia el histórico del informe anterior: así la gráfica de tendencia crece con cada ejecución.

Los enlaces a bugs y casos de prueba apuntan a `https://your-company.atlassian.net`. Para usar tu Jira:

```bash
# PowerShell
$env:JIRA_BASE_URL="https://miempresa.atlassian.net"; npm run demo
# Bash
JIRA_BASE_URL=https://miempresa.atlassian.net npm run demo
```

### Ejecución de tests

```bash
# Todos los tests en todos los navegadores (ejecución completa)
npm test

# Sólo un navegador
npm run test:chromium
npm run test:firefox

# Sólo una suite
npm run test:auth
npm run test:inventory
npm run test:checkout

# Con navegador visible (útil para depuración)
npm run test:headed

# En modo debug interactivo (paso a paso)
npm run test:debug

# Regenerar las capturas de referencia de la regresión visual
npm run test:visual:update

# Análisis estático
npm run lint
npm run typecheck
```

---

### Generación y visualización del reporte Allure

```bash
# Opción 1 — Generar y abrir en un solo comando
npm run allure:report

# Opción 2 — Por separado
npm run allure:generate   # Genera el HTML en ./allure-report/
npm run allure:open       # Abre el servidor local con el reporte

# Reporte básico de Playwright (alternativa ligera)
npm run report
```

> El reporte Allure requiere haber ejecutado los tests previamente para que exista la carpeta `allure-results/`.

---

## 7. Reporte Allure

Allure Report es el sistema de reporting principal de esta PoC. Genera un portal web interactivo con toda la información de la ejecución.

### Estructura del reporte

```
allure-report/
└── index.html    ← Punto de entrada — abrir en el navegador
```

### Secciones principales

| Sección | Descripción |
|:---|:---|
| **Overview** | Resumen ejecutivo: total de tests, porcentaje de éxito, distribución por suite y navegador, tendencia histórica |
| **Suites** | Árbol de tests agrupados por fichero y navegador, con el estado individual de cada caso |
| **Behaviors** | Árbol funcional *Epic → Feature → Story* (p. ej. *Compra online → Carrito y checkout → Compra completa*), ideal para negocio |
| **Timeline** | Vista temporal de la ejecución paralela; la barra de `performance_glitch_user` se ve claramente más larga |
| **Categories** | Clasificación automática de fallos: defecto del producto, elemento no encontrado, regresión visual, accesibilidad, rendimiento, timeout o error del test |
| **Environment** (en Overview) | URL probada, sistema operativo, versión de Node.js y si la ejecución es local o en CI |

### Información disponible por test

Todos los tests muestran:

- **Pasos de negocio** legibles (*Login como "standard_user" → Añadir "Sauce Labs Backpack" al carrito → Ir al carrito*), definidos en los Page Objects con `test.step`
- **Severidad** (blocker, critical, normal, minor) y **owner**
- **Parámetros** de los tests guiados por datos (las contraseñas, enmascaradas)
- **Enlaces** al caso de prueba (`allure.tms`) o al bug (`allure.issue`) en Jira

Cuando un test falla, Allure adjunta además:

- **Captura de pantalla** del momento del fallo (`screenshot: 'only-on-failure'`)
- **Vídeo** de la ejecución completa (`video: 'retain-on-failure'`)
- **Traza de Playwright** (`trace: 'retain-on-failure'`): permite inspeccionar paso a paso la ejecución, el DOM en cada momento y las peticiones de red

### Interpretación del resultado

| Indicador | Significado |
|:---|:---|
| Verde / `passed` | El test pasó en todos los navegadores |
| Rojo / `failed` | El test falló; revisar captura, vídeo y traza adjuntos |
| Amarillo / `broken` | Error de infraestructura del test (no de la app); revisar el stack trace |
| Azul / `flaky` | El test falló pero pasó en el reintento; posible problema de timing |

---

## 8. Integración continua con GitHub Actions

El workflow está definido en `.github/workflows/tests.yml` y se ejecuta automáticamente en dos situaciones:

### Triggers

| Evento | Condición |
|:---|:---|
| `pull_request` | Cuando se modifican ficheros en `tests/**` o `src/**` |
| `workflow_dispatch` | Ejecución manual desde la interfaz de GitHub Actions |

### Ejecución manual

Desde **GitHub → Actions → Playwright Tests → Run workflow** se puede configurar:

| Parámetro | Opciones | Por defecto |
|:---|:---|:---|
| `browser` | `all`, `chromium`, `firefox`, `mobile-chrome` | `all` |
| `environment` | `production` | `production` |

### Optimizaciones del pipeline

| Optimización | Beneficio |
|:---|:---|
| Cache de `node_modules` (clave: `hash(package-lock.json)`) | Evita reinstalar dependencias si no cambiaron |
| Cache de `~/.cache/ms-playwright` | Evita descargar los navegadores si la versión no cambió |
| Lint y typecheck antes de lanzar navegadores | Un error de código falla en segundos, sin esperar a los tests |
| Ejecución por suites con `continue-on-error` | Recoge resultados de las 4 suites (auth, inventory, checkout, quality) aunque una falle |
| `retries: 2` en CI | Distingue fallos reales de inestabilidades puntuales de red o timing |

### Artefactos generados

Cada ejecución de GitHub Actions sube dos artefactos descargables:

| Artefacto | Contenido | Retención |
|:---|:---|:---|
| `allure-report` | Reporte HTML completo de Allure con capturas, vídeos y trazas | 30 días |
| `playwright-report` | Reporte HTML nativo de Playwright | 7 días |

### Resumen en el Pull Request

Cada ejecución publica automáticamente una tabla de resultados en el apartado **Summary** del workflow:

```
🎭 Playwright Test Results

Suite           | Estado
:---------------|:------:
Authentication  | ✅ success
Inventory       | ✅ success
Checkout        | ✅ success
Quality         | ✅ success

Navegador: all  |  Entorno: production
```

---

## 9. Próximos pasos / Roadmap

La PoC ya cubre escenarios negativos (`problem_user`, `performance_glitch_user`), sesión reutilizada con `storageState`, accesibilidad, regresión visual y publicación del informe en GitHub Pages. Para llevarla a un nivel **production-ready**, se proponen:

### 1. Regresión visual también en CI

Generar las capturas de referencia dentro de la imagen Docker oficial de Playwright (`mcr.microsoft.com/playwright`), para que local y CI rendericen igual y la suite visual pueda ejecutarse en el pipeline.

### 2. Publicar el informe sólo desde `main`

Hoy cualquier Pull Request publica en GitHub Pages. Restringir la publicación a `main` y añadir un grupo `concurrency` evitaría que dos ejecuciones simultáneas pisen el histórico.

### 3. Datos de prueba dinámicos

Introducir una librería como [Faker.js](https://fakerjs.dev) para generar datos de checkout aleatorios en cada ejecución. Evita falsos positivos derivados de datos hardcodeados y mejora la cobertura de validaciones de formulario.

### 4. Allure 3 (sin Java)

Allure 3 está escrito en Node.js: elimina el requisito de instalar Java y ofrece una interfaz renovada. Reduce la fricción para que cualquier persona del equipo reproduzca el informe en local.

---

## Configuración local rápida

```bash
git clone git@github.com:tonyfht/poc_QA_E-commerce.git
cd poc_QA_E-commerce
npm install && npx playwright install
npm run demo        # tests + informe Allure (requiere Java)
```

---

<div align="center">
  <sub>PoC desarrollada sobre <a href="https://www.saucedemo.com">SauceDemo</a> · Playwright · TypeScript · Allure</sub>
</div>
