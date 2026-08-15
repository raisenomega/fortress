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
 */
export function toSelfNotes(raw: unknown): readonly SelfNoteDraft[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    const o = item as Record<string, unknown>
    if (!isKind(o.kind) || typeof o.area !== 'string' || typeof o.note !== 'string') return []
    if (o.note.trim().length === 0) return []
    return [{ kind: o.kind, area: o.area.slice(0, 80), note: o.note.slice(0, 500) }]
  })
}
