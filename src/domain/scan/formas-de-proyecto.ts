/**
 * Las tres formas de arbol que el manifiesto tiene que distinguir, tomadas de
 * proyectos reales. Todas anidadas a dos niveles a proposito: con rutas planas,
 * agrupar por uno o por dos segmentos da lo mismo, y un test asi pasaria igual
 * aunque la profundidad fuera una constante — comprobado con una mutacion.
 */

/** FORTRESS: todo cuelga de un `src/` unico. Profundidad 2. */
export const CONTENEDOR_UNICO = [
  'src/domain/scan/scanner.ts',
  'src/domain/scan/manifiesto.ts',
  'src/application/scan/run-scan.ts',
  'src/infrastructure/scan/claude-scanner.ts'
]

/** Health Flow: monorepo de tres apps bajo `apps/`. Profundidad 2. */
export const MONOREPO = [
  'apps/api/src/main.ts',
  'apps/api/src/modules/identity/Tenant.controller.ts',
  'apps/web/src/auth.ts',
  'apps/worker/index.ts'
]

/** Un proyecto simple: varias carpetas de codigo en la raiz. Profundidad 1. */
export const RAIZ_PLANA = [
  'handlers/checkout/index.js',
  'handlers/webhook/index.js',
  'models/order.js',
  'utils/format.js'
]
