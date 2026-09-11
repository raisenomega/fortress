import { aArea } from './area-de-observacion'
import { OBSERVATION_KINDS, type ObservationKind, type SelfNoteDraft } from './self-observation'

function isKind(value: unknown): value is ObservationKind {
  return typeof value === 'string' && OBSERVATION_KINDS.includes(value as ObservationKind)
}

/**
 * Valida las observaciones que un agente dejo, vengan por donde vengan: como
 * clave del JSON del analisis o como bloque de texto suelto.
 *
 * Tolerante a proposito: lo que no cumple se descarta en silencio y nunca lanza.
 * Una nota mal escrita no puede tumbar el analisis que la acompana — el trabajo
 * del agente vale mas que su apunte al margen.
 *
 * El `area` se CIERRA aqui (ADR-085, Fase 4): lo que no esta en el vocabulario
 * cae a `otro`, como el tipo de un hallazgo. Es lo que hace contable el backlog
 * —sin clase comun no hay dos observaciones «iguales» que contar— y por eso la
 * nota no se descarta cuando el area no encaja: se clasifica en el cajon, que
 * SE VE. Descartarla perderia el aprendizaje por un nombre mal elegido.
 */
export function toSelfNotes(raw: unknown): readonly SelfNoteDraft[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    const o = item as Record<string, unknown>
    if (!isKind(o.kind) || typeof o.note !== 'string') return []
    if (o.note.trim().length === 0) return []
    return [{ kind: o.kind, area: aArea(o.area), note: o.note.slice(0, 500) }]
  })
}
