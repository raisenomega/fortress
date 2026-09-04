import type { Proposal } from './proposal'

/**
 * Lo que YA se intento con este hallazgo, en una linea, para el analista.
 *
 * FORTRESS lo sabe y no se lo decia. Tres agentes distintos descubrieron por su
 * cuenta el mismo rastro —"el commit mas reciente que toca el fichero es
 * 322685a, y su mensaje empieza por `repair(la-salida-del-gate-se-persiste)`,
 * que es el slug del titulo de este mismo hallazgo"— y lo reconstruyeron a mano
 * cada vez, cuando el expediente lo tenia guardado desde el principio.
 *
 * Importa sobre todo el MERGEADO: un fix suyo que ya entro es la pista mas
 * fuerte de que el hallazgo puede estar OBSOLETO, y sin ella el analista empieza
 * de cero contra un defecto que quizas ya no existe. El hallazgo sigue abierto
 * porque nada muere sin juicio (ADR-065) y ningun escaneo lo ha vuelto a mirar,
 * no porque el arreglo no ocurriera.
 *
 * Es una PISTA, no un veredicto, y la linea lo dice: lo que cierra un hallazgo
 * sigue siendo la evidencia contra el fichero. Un merge puede haber arreglado
 * otra cosa del mismo sitio, o haberlo arreglado a medias — ya paso: "el commit
 * que cerro un hallazgo de CSP anadio un comentario y dejo el agujero en su
 * sitio".
 */
export function intentosPrevios(suyas: readonly Proposal[]): string | null {
  if (suyas.length === 0) return null
  const mergeadas = suyas.filter((p) => p.state === 'MERGEADO')
  const cola = mergeadas.length === 0 ? 'ninguno llego a integrarse.' : `${mergeadas.length} llegaron a MERGEADO: comprueba si el defecto sigue ahi antes que nada.` // prettier-ignore
  return `Este hallazgo ya tuvo ${suyas.length} propuesta(s) de reparacion; ${cola} Es una pista, no un veredicto: lo que decide sigue siendo el fichero.` // prettier-ignore
}
