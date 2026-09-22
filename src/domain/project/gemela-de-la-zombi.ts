/** Una fila viva con la clave de hoy que podria ser el mismo defecto. */
export interface Candidata {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly tipo: string
  readonly identity: string
}

/** Hasta donde una linea «es el mismo sitio»: el codigo de arriba crece y
 *  la linea de un mismo agujero viajo de la 43 a la 59 en tres escaneos. */
export const DISTANCIA_MAXIMA = 3

/**
 * La fila de hoy que dice el MISMO SITIO que la zombi: mismo fichero y a tres
 * lineas o menos. Medido en mailbd el 2026-09-22: 62 de 98 zombis la tienen,
 * 52 en la misma linea exacta. Exacta antes que cercana; a igual distancia, el
 * id menor, para que dos corridas sobre los mismos datos decidan lo mismo.
 *
 * Es una CANDIDATA, no un veredicto: si son el mismo defecto lo juzga el
 * agente leyendo el fichero, y `reclasificar` no acepta otra gemela que esta.
 */
export function gemelaDe(
  zombi: { readonly file: string; readonly line: number | null },
  vivas: readonly Candidata[]
): Candidata | null {
  if (zombi.line === null) return null
  const linea = zombi.line
  const distancia = (c: Candidata): number => Math.abs((c.line ?? Infinity) - linea)
  const cerca = vivas.filter((v) => v.file === zombi.file && distancia(v) <= DISTANCIA_MAXIMA)
  if (cerca.length === 0) return null
  return cerca.reduce((mejor, v) => {
    if (distancia(v) !== distancia(mejor)) return distancia(v) < distancia(mejor) ? v : mejor
    return v.id < mejor.id ? v : mejor
  })
}
