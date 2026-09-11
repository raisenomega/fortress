import { notasDeObjeto } from '../system/extraer-notas'
import type { SelfNoteDraft } from '../system/self-observation'
import { lastJsonBlock } from './parse-scan-output'

/**
 * Las notas sobre FORTRESS del MISMO bloque que trae los hallazgos (ADR-085).
 *
 * Aparte de `parseScanOutput` y no dentro: aquel devuelve un `Result` porque un
 * informe ilegible es un fallo con consecuencias —no se guarda nada—, mientras
 * que un informe legible SIN notas es el caso NORMAL. Mezclarlas obligaria a que
 * la ausencia de notas viajara como si fuera un error, o a que un error de
 * informe arrastrara las notas que si se entendieron.
 *
 * Reusa `lastJsonBlock` en vez de su propia regex: donde esta el informe es una
 * sola verdad, y dos copias divergirian el dia que el contrato cambie.
 */
export function notasDelInforme(output: string): readonly SelfNoteDraft[] {
  const block = lastJsonBlock(output)
  if (block === null) return []

  try {
    return notasDeObjeto(JSON.parse(block))
  } catch {
    return []
  }
}
