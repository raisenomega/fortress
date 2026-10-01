import { gateEnUnaLinea } from './aviso-de-herencia'
import type { ProposalEvent } from './proposal-event'

/** El motivo con el que el verificador asienta la correa que APLICO. Lo comparten
 *  quien la escribe y quien la lee: un literal repetido se desfasa. */
export const MOTIVO_CORREA = 'SCOPE'

const SIN_CORREA = 'CORREA: sin correa registrada (propuesta anterior a que se asentara)'
const SIN_GATE = 'GATE: sin gate registrado'

/** El objeto libre que viaja en la evidencia, leido con desconfianza: un JSON
 *  roto o de otra forma cuenta como NO registrado, nunca como vacio. */
function evidencia(e: ProposalEvent | undefined): Record<string, unknown> | null {
  if (e?.evidenceJson === undefined) return null
  try {
    const leido: unknown = JSON.parse(e.evidenceJson)
    return typeof leido === 'object' && leido !== null ? (leido as Record<string, unknown>) : null
  } catch {
    return null
  }
}

const lista = (v: unknown): readonly string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

function laCorrea(eventos: readonly ProposalEvent[]): string {
  const datos = evidencia(eventos.find((e) => e.reason === MOTIVO_CORREA))
  if (datos === null) return SIN_CORREA
  const ficheros = lista(datos.allowed)
  const grupos = lista(datos.allows)
  if (ficheros.length === 0 && grupos.length === 0) return SIN_CORREA
  const conGrupos = grupos.length === 0 ? '' : ` | grupos declarados: ${grupos.join(', ')}`
  return `CORREA aplicada: ${ficheros.join(', ') || '(ninguno por extension)'}${conGrupos}`
}

/**
 * La linea del gate para el revisor. Lleva la HERENCIA porque un verde con una
 * prueba absuelta no es un verde limpio, y juzgar como si lo fuera es juzgar con
 * menos de lo que el motor sabia. Decia «verde en todos los comandos» sobre doce
 * gates en los que `test:unit` se habia heredado: era falso, y lo leia el juez.
 */
function elGate(eventos: readonly ProposalEvent[]): string {
  const datos = evidencia(eventos.find((e) => e.toState === 'GATE'))
  if (datos === null) return SIN_GATE
  return `GATE: ${gateEnUnaLinea(datos.allCommandsGreen === true, lista(datos.heredado))}`
}

/**
 * Lo que el MOTOR ya sabia y el revisor no veia (DEUDAS §6.12).
 *
 * Dos observaciones del backlog con la misma raiz: el revisor no podia saber si
 * un fichero quedo fuera del diff porque la CORREA lo prohibia o porque el motor
 * lo OMITIO —la diferencia entre un fix correcto y uno incompleto— ni si el gate
 * habia pasado. El dato existia en los dos casos y moria antes de llegarle.
 *
 * Se LEE del libro de la propuesta, nunca se recalcula. Recalcular la correa
 * daria la universal y no los grupos leidos del arbol, asi que podria no ser la
 * que se aplico, y entonces el revisor juzgaria contra una correa que nunca
 * existio: eso es peor que no darle ninguna, porque cambia «no lo se» por «lo se
 * mal».
 *
 * Y lo que no esta en el libro se DICE. Misma doctrina que la factura ausente:
 * una factura que falta no es una factura de ceros. Una propuesta anterior a
 * este asiento sale «sin correa registrada», que es verdad y es accionable.
 */
export function loQueElMotorSupo(eventos: readonly ProposalEvent[]): readonly string[] {
  return [laCorrea(eventos), elGate(eventos)]
}
