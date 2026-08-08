import type { Candidate } from './select-target'

/**
 * Entendimiento INERTE de un hallazgo: que cambiar, donde, que patron copiar, que NO
 * tocar y el riesgo. Es el borrador del ENTENDIMIENTO (C2), no el del fix (C3).
 */
export interface Analysis {
  readonly target: Candidate
  readonly whatToChange: string
  readonly where: string
  /** El patron a copiar y de donde (guardRun en scan-handlers/quality-handlers). */
  readonly patternToCopy: string
  readonly doNotTouch: string
  readonly risk: string
  /** Tokens que costo el analisis (grafo-primero deberia ser barato). */
  readonly tokensUsed: number
}

/** COMPLETO (listo para C3) si todas las partes de prosa tienen contenido. */
export function isComplete(a: Analysis): boolean {
  return [a.whatToChange, a.where, a.patternToCopy, a.doNotTouch, a.risk].every(
    (part) => part.trim().length > 0
  )
}

/** Puerto: el analista grafo-primero que ESTUDIA el hallazgo. Infra lo implementa. */
export interface Analyst {
  study(target: Candidate): Promise<Analysis>
}
