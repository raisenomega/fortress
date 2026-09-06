/**
 * Tres callejones que el analista recorrio muchas veces y el prompt no le
 * ahorraba: pedir Bash —que no tiene—, barrer el repo entero con un patron
 * corto, y volcar un .md por el grafo cuando leerlo sale mas barato.
 *
 * Ninguno era un fallo suyo: el prompt le exigia "entender BARATO" sin decirle
 * cual es la forma barata, y le daba herramientas cuyo coste real solo se
 * descubre gastandolo. Decirselo cuesta nueve lineas de prompt.
 */
export const CALLEJONES: readonly string[] = [
  'NO tienes Bash: no puedes correr git, ni diffear, ni medir nada ejecutandolo.',
  'check_index_coverage y detect_changes son lo que lo sustituye. Si aun asi te',
  'falta un dato que solo daria un comando, dilo en "notes" en vez de suponerlo.',
  '',
  'Acota por ruta desde la PRIMERA llamada: file_pattern casa por SUBCADENA de la',
  'ruta (no es glob ni regex), y un patron corto contra todo el repo tarda',
  'segundos y llena el contexto de vecinos que no vas a leer. Un .md entra en el',
  'grafo como UN nodo Module entero, asi que para leer un documento usa Read: el',
  'grafo sirve para saber CUAL leer, no para volcarlo.',
  ''
]
