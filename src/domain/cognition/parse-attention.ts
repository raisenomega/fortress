import type { AttentionZone } from './cognition-log'
import { realLines } from './template-guard'

/** "src/auth/   0.90   Maneja autenticacion" — zona, peso y razon. */
const ZONA = /^(\S+)\s+([01](?:[.,]\d+)?)\s+(.*)$/

/**
 * El peso vive entre 0 y 1. Un valor fuera de rango indica que la linea no era
 * un peso sino otra cosa que se le parecia, asi que se descarta entera en vez
 * de acotarla: acotar convertiria basura en un dato con pinta de valido.
 */
function toZone(line: string): AttentionZone | null {
  const match = ZONA.exec(line)
  if (!match) return null

  const weight = Number.parseFloat(match[2].replace(',', '.'))
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) return null

  return { zone: match[1], weight, reason: match[3].trim() }
}

export function parseAttention(section: string | null): readonly AttentionZone[] {
  if (section === null) return []

  return realLines(section)
    .map(toZone)
    .filter((zone): zone is AttentionZone => zone !== null)
}
