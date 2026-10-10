import type { CognitionSnapshot } from '../cognition/cognition-log'
import type { Proposal } from '../repair/proposal'
import type { ProposalEvent } from '../repair/proposal-event'
import type { MarcoDelKit } from './bloque-cto-kit'
import { marcoDeLineas } from './marcos-del-libro'

/**
 * Los marcos del MOTOR y del DISCO del proyecto anclado (Sello B.1): dominio
 * puro, recibe lo ya leido. Los eventos llegan COLGADOS de su propuesta —el
 * ensamblador los resolvio por proyecto primero (el ancla indirecta, cerrada)—
 * y aqui solo se resumen.
 */
export interface PropuestaConEventos {
  readonly propuesta: Proposal
  readonly eventos: readonly ProposalEvent[]
}

/** Una linea por propuesta: estado, hallazgo y hasta donde llego su cadena. */
export function marcoDeReparaciones(filas: readonly PropuestaConEventos[]): MarcoDelKit {
  const lineas = filas.map(({ propuesta, eventos }) => {
    const ultimo = eventos[eventos.length - 1]
    const cadena = ultimo === undefined ? 'sin asientos' : `${eventos.length} asientos, ultimo ${ultimo.phase}` // prettier-ignore
    return `${propuesta.state} · hallazgo ${propuesta.findingId} · ${cadena}`
  })
  return marcoDeLineas('reparaciones', lineas)
}

/** La cabeza de cognicion: solo los patrones ACTIVE, que son lo vigilado hoy. */
export function marcoDeCognicion(s: CognitionSnapshot): MarcoDelKit {
  const activos = s.present ? s.patterns.filter((p) => p.status === 'ACTIVE') : []
  const lineas = activos.map((p) => `${p.id} · ${p.title}${p.severity === null ? '' : ` · ${p.severity}`}`) // prettier-ignore
  return marcoDeLineas('cognicion-activa', lineas)
}

/** Los .md de la raiz, SOLO por nombre: el indice, no el volcado. */
export function marcoDeDocs(nombres: readonly string[]): MarcoDelKit {
  return marcoDeLineas('docs-del-proyecto', nombres)
}
