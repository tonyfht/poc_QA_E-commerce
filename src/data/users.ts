/**
 * DATASET DE PRUEBA — Credenciales y datos de formulario
 * -------------------------------------------------------
 * SauceDemo expone deliberadamente varios usuarios preconfigurados, cada uno
 * diseñado para simular un estado o comportamiento distinto de la aplicación.
 * Centralizar estos datos aquí, en lugar de dispersarlos en los tests, tiene
 * dos ventajas clave:
 *
 *   1. Si la aplicación cambia una contraseña o un nombre de usuario, basta
 *      con modificar este fichero para que todos los tests se actualicen.
 *
 *   2. Los tests quedan limpios de "magic strings" y el lector puede entender
 *      qué perfil de usuario se está usando sin conocer las credenciales.
 *
 * "as const" convierte el objeto en un tipo literal readonly en profundidad,
 * evitando que ningún test pueda mutar accidentalmente los datos compartidos.
 */

export const users = {
  /**
   * Usuario estándar — el "camino feliz" (happy path).
   * Tiene acceso completo a la aplicación sin restricciones ni anomalías.
   * Es el usuario de referencia para validar flujos nominales:
   * login correcto, navegación por el catálogo, carrito y checkout.
   */
  standard: {
    username: 'standard_user',
    password: 'secret_sauce',
  },

  /**
   * Usuario bloqueado — simula una cuenta suspendida o revocada.
   * Comparte contraseña con el resto de usuarios para aislar la variable:
   * el motivo del fallo es la política de acceso, no una credencial incorrecta.
   * Permite verificar que la aplicación muestra el mensaje de error adecuado
   * y no permite el acceso bajo ninguna circunstancia.
   */
  locked: {
    username: 'locked_out_user',
    password: 'secret_sauce',
  },

  /**
   * Usuario con problemas — simula una UI rota o con bugs.
   * Al iniciar sesión con este perfil, algunas imágenes de productos aparecen
   * incorrectas y ciertos botones no funcionan como se espera.
   * Es útil para tests que validan la robustez ante estados anómalos de la UI.
   * (No se usa en la suite actual, disponible para expansión futura.)
   */
  problem: {
    username: 'problem_user',
    password: 'secret_sauce',
  },

  /**
   * Usuario con degradación de rendimiento — simula latencia de backend.
   * Las acciones tardan varios segundos de forma intencionada, lo que permite
   * testear timeouts, spinners de carga y la resiliencia de los locators
   * ante respuestas lentas.
   * (No se usa en la suite actual, disponible para expansión futura.)
   */
  performance: {
    username: 'performance_glitch_user',
    password: 'secret_sauce',
  },
} as const;

/**
 * Datos de formulario para el proceso de checkout.
 * -------------------------------------------------------
 * SauceDemo no valida que los datos sean reales (no hay integración con
 * pasarelas de pago ni verificación de direcciones), por lo que se usan
 * valores genéricos que simplemente cubren el flujo del formulario.
 *
 * Agrupar los datos bajo una clave semántica ("valid") prepara la estructura
 * para añadir en el futuro casos de datos inválidos (campos vacíos,
 * código postal con letras, etc.) sin romper los tests existentes.
 */
export const checkoutData = {
  /**
   * Datos válidos: completan el formulario de envío sin errores de validación.
   * Son suficientes para avanzar de "Checkout Step One" a "Step Two".
   */
  valid: {
    firstName: 'John',
    lastName: 'Doe',
    postalCode: '12345',
  },
} as const;
