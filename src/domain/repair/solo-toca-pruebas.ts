/**
 * Un fichero de PRUEBA con el molde del repo. Se queda en `.test.ts(x)` a
 * proposito y no abarca fixtures ni helpers: esos se tocan de verdad junto al
 * codigo, y meterlos aqui convertiria un fix legitimo en un rechazo.
 */
export function esFicheroDePrueba(file: string): boolean {
  return /\.test\.tsx?$/.test(file)
}

/**
 * La red que faltaba ANTES del revisor: un diff que SOLO toca pruebas cuando el
 * hallazgo vive en produccion.
 *
 * Se pillo en vivo: el analisis decia que el ancla no necesitaba cambios y que
 * elegir el camino pedia un ADR humano, y el motor entrego igualmente una
 * propuesta que solo tocaba los tests del ancla. Un test escrito con los valores
 * que uno QUIERE pasa el gate en VERDE sin haber rozado el defecto, asi que el
 * gate no lo caza —esta verde de verdad— y el revisor gasta su turno juzgando un
 * fix que no arregla nada. El hallazgo, mientras, sigue vivo en el tablero.
 *
 * La excepcion es necesaria y no es un hueco: cuando el hallazgo ESTA en un
 * fichero de prueba —un test que miente, uno que no cubre lo que dice—, tocar
 * solo pruebas es exactamente el arreglo correcto.
 *
 * Mide el diff REAL que vio git, no lo que el generador dijo tocar, por la misma
 * razon que `checkScope`: lo que se juzga es lo que quedo escrito.
 */
export function soloTocaPruebas(changed: readonly string[], ancla: string): boolean {
  if (changed.length === 0) return false
  if (esFicheroDePrueba(ancla)) return false
  return changed.every(esFicheroDePrueba)
}
