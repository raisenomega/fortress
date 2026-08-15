import { toSelfNotes } from './self-note-item'
import type { NewSelfObservation } from './self-observation'

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
  return toSelfNotes(raw).map((nota) => ({ ...nota, sourceProject }))
}
