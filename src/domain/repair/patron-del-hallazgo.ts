import type { CognitionPattern } from '../cognition/cognition-log'
import { patternSuffix } from '../cognition/pattern-id'
import type { Candidate } from './select-target'

/**
 * Lo que el COGNITION-LOG del proyecto ya sabe del hallazgo que se va a estudiar.
 *
 * FORTRESS lo tenia escrito y no se lo daba: el analista llegaba con titulo,
 * fichero y linea, y el estado del patron —ACTIVE o EXTINTO, desde cuando, y
 * cuantas veces se ha vuelto a ver— lo encontraba a grep si se le ocurria
 * buscarlo. Es el dato que separa "defecto nuevo" de "reincidencia de uno que
 * se dio por muerto", y esa diferencia cambia el veredicto: un patron marcado
 * EXTINTO cuyo defecto sigue en el fichero es una extincion falsa, no un
 * hallazgo cualquiera.
 *
 * El emparejamiento va por el SUFIJO del id, no por el id entero: el ano del
 * `PTN-ANO-NNNNNN` es el de primera deteccion y no se puede reconstruir desde
 * el candidato. El sufijo sale de severidad+fichero+titulo, que es justo lo que
 * el candidato lleva.
 */
export function patronDelHallazgo(
  t: Candidate,
  patrones: readonly CognitionPattern[]
): readonly string[] {
  const sufijo = patternSuffix({ severity: t.severity, file: t.file, title: t.title })
  const patron = patrones.find((p) => p.id.endsWith(`-${sufijo}`))
  if (patron === undefined) return []
  const veces =
    patron.recurrences === null
      ? ''
      : `, visto ${patron.recurrences} ${patron.recurrences === 1 ? 'vez' : 'veces'}`
  const desde = patron.detectedAt === null ? '' : ` desde ${patron.detectedAt}`
  return [
    '',
    `En el COGNITION-LOG del proyecto este hallazgo es ${patron.id}: ${patron.status}${veces}${desde}.`,
    ...(patron.status === 'EXTINTO'
      ? ['Estaba dado por EXTINTO: si el defecto sigue ahi, dilo en "notes" — la', 'extincion fue falsa y esa es la unica forma de que FORTRESS lo sepa.'] // prettier-ignore
      : [])
  ]
}
