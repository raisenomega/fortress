/**
 * Dos callejones que el analista recorrio muchas veces y el prompt no le
 * ahorraba: barrer el repo entero con un patron corto, y volcar un .md por el
 * grafo cuando leerlo sale mas barato.
 *
 * Ninguno era un fallo suyo: el prompt le exigia "entender BARATO" sin decirle
 * cual es la forma barata, y le daba herramientas cuyo coste real solo se
 * descubre gastandolo. Aqui vivio tambien «NO tienes Bash», que era FALSO —el
 * analista lo tiene, medido en vivo— y ahora lo dice `bloqueDeCapacidades`,
 * leido de los args reales: un texto fijo no puede volver a mentir.
 */
export const CALLEJONES: readonly string[] = [
  'Acota por ruta desde la PRIMERA llamada: file_pattern casa por SUBCADENA de la',
  'ruta (no es glob ni regex), y un patron corto contra todo el repo tarda',
  'segundos y llena el contexto de vecinos que no vas a leer. Un .md entra en el',
  'grafo como UN nodo Module entero, asi que para leer un documento usa Read: el',
  'grafo sirve para saber CUAL leer, no para volcarlo.',
  ''
]
