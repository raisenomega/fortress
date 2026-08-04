import {
  OBSERVATION_KINDS,
  type NewSelfObservation,
  type ObservationKind
} from './self-observation'

function isKind(value: unknown): value is ObservationKind {
  return typeof value === 'string' && OBSERVATION_KINDS.includes(value as ObservationKind)
}

/**
 * Extrae las auto-observaciones sobre FORTRESS que un agente dejo en su salida.
 * Formato: `FORTRESS-NOTES:` seguido de un array JSON `[{kind, area, note}]`.
 * Tolerante a proposito: si no hay bloque, esta mal formado, o un item no cumple,
 * se descarta ese item; nunca lanza. Asi una nota mal escrita no rompe el ciclo.
 */
export function parseSelfNotes(text: string, sourceProject: string): readonly NewSelfObservation[] {
  const match = text.match(/FORTRESS-NOTES:\s*(\[[\s\S]*?\])/)
  if (!match) return []

  let raw: unknown
  try {
    raw = JSON.parse(match[1])
  } catch {
    return []
  }
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item) => {
    const o = item as Record<string, unknown>
    if (!isKind(o.kind) || typeof o.area !== 'string' || typeof o.note !== 'string') return []
    if (o.note.trim().length === 0) return []
    return [{ sourceProject, kind: o.kind, area: o.area.slice(0, 80), note: o.note.slice(0, 500) }]
  })
}
