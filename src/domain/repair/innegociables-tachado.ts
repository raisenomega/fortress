/**
 * La familia del TACHADO: lo que decide que NO se ensena al operador ni se
 * escribe en disco. Es la puerta de SALIDA, hermana del saneado, que es la de
 * entrada al prompt.
 *
 * Sale a su propio modulo por lo mismo que sus hermanas: las dos listas donde
 * vivia —`innegociables-defensa` y `auto-merge-blacklist`— estaban las dos en su
 * techo de lineas, y el corte se hace por FAMILIA y no por tamano.
 *
 * Van las TRES y no solo las reglas: `reglas-de-secreto` las declara,
 * `tool-detail` las aplica en `redactSecrets`, y `en-vivo-tachado` es quien lo
 * llama para el chat — sin esa llamada la funcion existe y nadie la usa. Es la
 * leccion que la lista ya aprendio dos veces: proteger la regla y dejar suelto a
 * quien la ejecuta no protege nada.
 */
export const DEFENSAS_DEL_TACHADO: readonly string[] = [
  'src/domain/chat/reglas-de-secreto.ts',
  'src/domain/chat/secreto-por-nombre.ts',
  'src/domain/chat/tool-detail.ts',
  'src/application/chat/en-vivo-tachado.ts',
  'src/domain/repair/innegociables-tachado.ts'
]
