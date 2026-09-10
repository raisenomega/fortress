/**
 * Que cuenta como fichero de FUENTE. Vivia suelto en `maintainability-probe`,
 * que era su unico consumidor; el manifiesto de paradas (ADR-082) es el
 * segundo, y dos copias de esta lista divergen el dia que alguien anade un
 * lenguaje en un sitio y no en el otro. Una sola verdad, y en el dominio: que
 * es codigo y que no lo es no depende de git ni del filesystem.
 *
 * Sin la bandera `g` a proposito: un regex global lleva `lastIndex` y `test`
 * alterna resultados entre llamadas. Compartido, eso seria un fallo silencioso.
 */
export const ES_FUENTE = /\.(ts|tsx|js|jsx|py|go|rs|java|rb)$/

export const esFuente = (ruta: string): boolean => ES_FUENTE.test(ruta)
