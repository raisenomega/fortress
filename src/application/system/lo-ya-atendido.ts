import type { SelfObservation } from '@domain/system/self-observation'
import type { AppContext } from '../context'

const MAX = 40
const MAX_LEN = 200

/**
 * El area, la nota y el motivo los escribio OTRO AGENTE en prosa libre, y este
 * texto vuelve al prompt de un agente futuro: es un canal agente -> agente que
 * atraviesa la base del operador, y este saneado es el unico filtro entre los
 * dos. Se aplana a una linea y se acota para que ni un salto de linea ni un
 * marcador puedan romper el formato del prompt e inyectar ordenes. El mismo
 * tratamiento que `knownFindings` da al texto del repo auditado, y por la misma
 * razon: quien escribe no es quien lee.
 */
function sanitize(text: string): string {
  const flat = text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return flat.length > MAX_LEN ? `${flat.slice(0, MAX_LEN)}…` : flat
}

/**
 * El motivo viaja SOLO en el descarte, y la asimetria es deliberada. Lo atendido
 * ya no esta en el codigo: basta el tema para reconocerlo. Lo descartado SIGUE
 * ahi, intacto y visible, asi que sin la razon el agente lo vuelve a levantar
 * con toda la logica del mundo — y la lista, que existe para callar el ruido,
 * seria el ruido. `null` en un descarte no deberia ocurrir (el contrato lo
 * exige), pero si ocurre se dice, que es mejor que insinuar que no hubo juicio.
 */
function linea(obs: SelfObservation): string {
  const tema = sanitize(`${obs.area} — ${obs.note}`)
  if (obs.status !== 'descartado') return tema
  return `${tema} (descartado: ${obs.reason === null ? 'sin motivo escrito' : sanitize(obs.reason)})`
}

/**
 * Lo que FORTRESS ya trato, en texto, para que el analista no lo vuelva a
 * observar. Es el reverso de `listOpen`: no el backlog, sino su memoria.
 *
 * Las mas recientes primero y solo las MAX ultimas, porque lo recien cerrado es
 * justo lo que mas riesgo tiene de re-reportarse: el agente que trabaja hoy ve
 * el arreglo de ayer, no el de marzo. Sin cerradas devuelve una lista vacia, no
 * un encabezado con nada debajo: una seccion vacia en el prompt no informa de
 * que no hay nada, sugiere que se perdio algo.
 */
export function loYaAtendido(context: AppContext): readonly string[] {
  return context.selfObservations.listClosed(MAX).map(linea)
}
