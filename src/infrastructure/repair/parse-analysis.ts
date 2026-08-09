import type { Analysis } from '@domain/repair/analysis'
import type { Candidate } from '@domain/repair/select-target'

/** Lo que devuelve la corrida headless: el texto y los tokens que costo. */
export interface RunOut {
  readonly result: string
  readonly tokens: number
}

/** Extrae el Analysis del JSON que el analista deja en su respuesta. */
export function toAnalysis(target: Candidate, out: RunOut): Analysis {
  const match = out.result.match(/\{[\s\S]*\}/)
  const j = (match ? JSON.parse(match[0]) : {}) as Record<string, string>
  const text = (k: string): string => (j[k] ?? '').trim()
  return {
    target,
    status: text('status') || 'DESCONOCIDO',
    whatToChange: text('whatToChange'),
    where: text('where'),
    patternToCopy: text('patternToCopy'),
    doNotTouch: text('doNotTouch'),
    risk: text('risk'),
    tokensUsed: out.tokens
  }
}
