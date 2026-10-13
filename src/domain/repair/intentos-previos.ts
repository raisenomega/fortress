/**
 * Lo que YA se intento con este hallazgo, en una linea, para el analista.
 *
 * FORTRESS lo sabe y no se lo decia. Tres agentes distintos descubrieron por su
 * cuenta el mismo rastro —"el commit mas reciente que toca el fichero es
 * 322685a, y su mensaje empieza por `repair(la-salida-del-gate-se-persiste)`,
 * que es el slug del titulo de este mismo hallazgo"— y lo reconstruyeron a mano
 * cada vez, cuando el expediente lo tenia guardado desde el principio.
 *
 * Importa sobre todo el integrado: un fix suyo que YA entro (GIT lo confirma, no
 * un contador) es la pista mas fuerte de que el hallazgo puede estar OBSOLETO. El
 * `integradas` lo cuenta quien ve git (la aplicacion): un MERGEADO por estado cuyo
 * commit git no ve —rama borrada, merge que no aterrizo— NO cuenta (observacion
 * `ciclo-del-hallazgo`: el brief decia MERGEADO de un commit ausente de main).
 *
 * Es una PISTA, no un veredicto, y la linea lo dice: lo que cierra un hallazgo
 * sigue siendo la evidencia contra el fichero. Un merge puede haber arreglado
 * otra cosa del mismo sitio, o haberlo arreglado a medias — ya paso: "el commit
 * que cerro un hallazgo de CSP anadio un comentario y dejo el agujero en su
 * sitio".
 */
export function intentosPrevios(total: number, integradas: number): string | null {
  if (total === 0) return null
  const cola = integradas === 0 ? 'git no confirma ninguno integrado.' : `${integradas} confirmado(s) en git como integrado(s): comprueba si el defecto sigue ahi antes que nada.` // prettier-ignore
  return `Este hallazgo ya tuvo ${total} propuesta(s) de reparacion; ${cola} Es una pista, no un veredicto: lo que decide sigue siendo el fichero.` // prettier-ignore
}
