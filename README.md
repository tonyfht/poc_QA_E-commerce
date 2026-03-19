# POC — Automatización de Pruebas con Playwright

[![Playwright Tests](https://github.com/tonyfht/poc_playwright/actions/workflows/tests.yml/badge.svg)](https://github.com/tonyfht/poc_playwright/actions/workflows/tests.yml)
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
| **Reporting profesional** | Generación de reportes Allure con historial, trazas, capturas y vídeos |
| **Integración continua** | Workflow de GitHub Actions con caché, ejecución por suites y artefactos |
| **Tipado estático** | TypeScript con tipos estrictos en todo el proyecto para detectar errores en compilación |

La suite ejecuta **16 casos de prueba** distribuidos en **3 suites** sobre **3 navegadores**, generando un total de **48 ejecuciones** por ciclo de CI.

---

## 2. Arquitectura del proyecto

```
poc_playwright/
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
│   │                               # Define dos variantes: sin autenticación y pre-autenticada.
│   │
│   └── data/
│       └── users.ts                # Dataset centralizado: credenciales y datos de formulario.
│                                   # Separa los datos del código de prueba.
│
├── tests/                          # Suites de tests — un fichero por área funcional
│   ├── auth.spec.ts                # Suite: autenticación (5 casos)
│   ├── inventory.spec.ts           # Suite: catálogo de productos (7 casos)
│   └── checkout.spec.ts           # Suite: carrito y flujo de compra (4 casos)
│
├── .github/
│   └── workflows/
│       └── tests.yml               # Pipeline de GitHub Actions: CI completo con Allure
│
├── playwright.config.ts            # Configuración global: navegadores, reporters, base URL
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
| [allure-commandline](https://allurereport.org) | 2.38 | CLI de Allure: transforma los datos fuente en el reporte HTML interactivo |
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
| `problem_user` | `secret_sauce` | UI con defectos visuales y funcionales | Disponible para tests de regresión de UI (roadmap) |
| `performance_glitch_user` | `secret_sauce` | Latencia artificial de varios segundos | Disponible para tests de rendimiento (roadmap) |

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

### Suite: Autenticación (`auth.spec.ts`) — 5 tests

| # | Caso de prueba | Qué verifica |
|:---:|:---|:---|
| 1 | Login exitoso con credenciales válidas | La URL cambia a `/inventory.html` tras autenticarse correctamente |
| 2 | Error con usuario bloqueado | El mensaje de error contiene `locked out`; el acceso es denegado aunque la contraseña sea correcta |
| 3 | Error con credenciales inválidas | El mensaje de error indica que usuario y contraseña no coinciden |
| 4 | Error con campos vacíos | La validación frontend detecta el campo vacío antes de enviar al servidor |
| 5 | Logout exitoso | Tras cerrar sesión, la URL vuelve a `/` (pantalla de login) |

### Suite: Catálogo de productos (`inventory.spec.ts`) — 7 tests

| # | Caso de prueba | Qué verifica |
|:---:|:---|:---|
| 6 | Visualización del catálogo completo | El catálogo muestra exactamente 6 productos |
| 7 | Añadir un producto al carrito | El badge del carrito aumenta a 1 |
| 8 | Añadir múltiples productos | El badge acumula correctamente (valor 2) |
| 9 | Eliminar un producto del carrito | El badge desaparece al quedar el carrito vacío (valor 0) |
| 10 | Ordenar por precio ascendente | Cada precio es ≥ al anterior en la lista |
| 11 | Ordenar por precio descendente | Cada precio es ≤ al anterior en la lista |
| 12 | Ordenar por nombre A→Z | El orden de la UI coincide con el orden alfabético calculado |

### Suite: Carrito y checkout (`checkout.spec.ts`) — 4 tests

| # | Caso de prueba | Qué verifica |
|:---:|:---|:---|
| 13 | Ítems correctos en el carrito | El carrito muestra 2 ítems con los nombres exactos de los productos añadidos |
| 14 | Eliminar un ítem desde el carrito | El conteo se reduce a 1 tras la eliminación |
| 15 | **Flujo de compra completo (E2E)** | Carrito → Paso 1 (datos envío) → Paso 2 (resumen) → Paso 3 (confirmación) |
| 16 | Navegación de retorno al inventario | "Continue Shopping" devuelve al catálogo desde el carrito |

**Total: 16 tests × 3 navegadores = 48 ejecuciones por ciclo**

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
git clone git@github.com:tonyfht/poc_playwright.git
cd poc_playwright

# 2. Instalar dependencias de Node
npm install

# 3. Descargar navegadores de Playwright
npx playwright install
```

> `node_modules/` no se incluye en el repositorio. Este paso es obligatorio tras cada clonado.

---

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
| **Suites** | Árbol de tests agrupados por suite (`auth`, `inventory`, `checkout`) con estado individual de cada caso |
| **Behaviors** | Tests organizados por comportamiento (describe/test), ideal para presentación a negocio |
| **Timeline** | Vista temporal de la ejecución paralela: muestra cuántos tests corrieron simultáneamente |
| **Categories** | Clasificación automática de fallos: errores de producto vs errores de test |

### Información disponible por test

Cuando un test falla, Allure proporciona automáticamente:

- **Captura de pantalla** del momento del fallo (configurado con `screenshot: 'only-on-failure'`)
- **Vídeo** de la ejecución completa (configurado con `video: 'retain-on-failure'`)
- **Traza de Playwright** (configurado con `trace: 'on-first-retry'`): permite inspeccionar paso a paso la ejecución, el DOM en cada momento y las peticiones de red

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
| Ejecución por suites con `continue-on-error` | Recoge resultados de las 3 suites aunque una falle |
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

Navegador: all  |  Entorno: production
```

---

## 9. Próximos pasos / Roadmap

La PoC demuestra los fundamentos de una arquitectura de automatización sólida. Para elevarla a un nivel **production-ready**, se proponen las siguientes mejoras:

### 1. Ampliar la cobertura de escenarios negativos

Incorporar tests con `problem_user` y `performance_glitch_user` para cubrir escenarios de UI rota y degradación de rendimiento. Esto demostraría la capacidad del framework de detectar regresiones sutiles que los tests de happy path no detectan.

### 2. Autenticación vía API (setup optimizado)

Sustituir el login por UI en `authenticatedTest` por una llamada directa a la API de sesión, inyectando el token/cookie directamente en el contexto del navegador. Esto reduciría el tiempo de setup de cada test de ~2 segundos a ~100 ms, especialmente relevante cuando la suite crezca.

### 3. Datos de prueba dinámicos

Introducir una librería como [Faker.js](https://fakerjs.dev) para generar datos de checkout aleatorios en cada ejecución. Evita falsos positivos derivados de datos hardcodeados y mejora la cobertura de validaciones de formulario.

### 4. Publicación del reporte Allure en GitHub Pages

Configurar el workflow para desplegar el reporte Allure en GitHub Pages tras cada ejecución en `main`. El cliente o el equipo podría consultar el histórico de ejecuciones desde un navegador sin necesidad de descargar artefactos.

### 5. Test de accesibilidad (a11y) integrado

Incorporar [axe-core](https://github.com/dequelabs/axe-core) a través del plugin de Playwright para ejecutar auditorías de accesibilidad WCAG sobre cada página como un paso adicional de los tests existentes, sin duplicar la cobertura funcional.

---

## Configuración local rápida

```bash
git clone git@github.com:tonyfht/poc_playwright.git
cd poc_playwright
npm install && npx playwright install
npm test
npm run allure:report
```

---

<div align="center">
  <sub>PoC desarrollada sobre <a href="https://www.saucedemo.com">SauceDemo</a> · Playwright · TypeScript · Allure</sub>
</div>
