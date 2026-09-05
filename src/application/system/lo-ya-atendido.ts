import { sanearParaPrompt } from '@domain/shared/sanear-para-prompt'
import type { SelfObservation } from '@domain/system/self-observation'
import type { AppContext } from '../context'

const MAX = 40

/**
 * Cada linea lleva las DOS mitades: que se observo, y que se hizo con ello.
 *
 * El motivo viajaba solo en el descarte, con el argumento de que lo atendido ya
 * no esta en el codigo y basta el tema. Era falso en la practica: bajo un
 * encabezado que dice "ya atendido", el agente leia el ENUNCIADO DEL PROBLEMA
 * RESUELTO —"la llamada a list_projects fue denegada por permisos"— sin una
 * palabra de que se arreglo ni como. Le repetiamos la queja de algo que ya no
 * pasa, que es lo contrario de lo que esta lista existe para hacer.
 *
 * Ahora las dos ramas son simetricas y el `reason` lleva el sha del arreglo,
 * asi que la memoria dice donde mirar en vez de solo que no insista. `null` no
 * deberia ocurrir en un descarte (el contrato lo exige) y si puede ocurrir en
 * un atendido; en ambos casos se dice, que es mejor que insinuar que no hubo
 * juicio.
 */
function linea(obs: SelfObservation): string {
  const tema = sanearParaPrompt(`${obs.area} — ${obs.note}`)
  const verbo = obs.status === 'descartado' ? 'descartado' : 'arreglado'
  const razon = obs.reason === null ? 'sin detalle escrito' : sanearParaPrompt(obs.reason)
  return `${tema} → ${verbo}: ${razon}`
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
