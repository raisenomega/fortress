import { totalTokens, type TokenUsage } from '@domain/telemetry/token-usage'
import type { Analysis } from '@domain/repair/analysis'
import type { Candidate } from '@domain/repair/select-target'
import { toSelfNotes } from '@domain/system/self-note-item'

/** Lo que devuelve la corrida headless: el texto y la factura entera. */
export interface RunOut {
  readonly result: string
  readonly usage: TokenUsage
}

/**
 * Extrae el Analysis del JSON que el analista deja en su respuesta.
 *
 * El barrido es codicioso —del primer `{` al ultimo `}`— y por eso la respuesta
 * tiene que traer UN solo objeto. Las auto-observaciones viajan como una clave
 * mas dentro de el: un bloque aparte con su propio JSON haria que este barrido
 * se tragara los dos y reventara el analisis entero.
 */
export function toAnalysis(target: Candidate, out: RunOut): Analysis {
  const match = out.result.match(/\{[\s\S]*\}/)
  const j = (match ? JSON.parse(match[0]) : {}) as Record<string, unknown>
  const text = (k: string): string => (typeof j[k] === 'string' ? j[k] : '').trim()
  const notes = toSelfNotes(j.notes)
  return {
    target,
    status: text('status') || 'DESCONOCIDO',
    whatToChange: text('whatToChange'),
    where: text('where'),
    patternToCopy: text('patternToCopy'),
    doNotTouch: text('doNotTouch'),
    risk: text('risk'),
    tokensUsed: totalTokens(out.usage),
    ...(notes.length > 0 ? { notes } : {})
  }
}
