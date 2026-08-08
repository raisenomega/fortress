import type { FindingMemory } from '../project/finding-memory'

/**
 * Las DOS pruebas que exige extinguir un hallazgo. Se piden juntas a proposito.
 */
export interface ExtinctionEvidence {
  /** Claves que el escaneo nuevo SI reporto. */
  readonly reported: ReadonlySet<string>
  /** Claves cuyo archivo CAMBIO desde su primera deteccion, segun git. */
  readonly touched: ReadonlySet<string>
}

/**
 * Un hallazgo se extingue SOLO si el escaneo no lo reporta Y ademas su archivo
 * cambio desde que se vio por primera vez.
 *
 * La ausencia SOLA no vale. El escaner es un LLM leyendo codigo, no una funcion
 * determinista: la misma base puede darle cuatro hallazgos hoy y siete manana
 * describiendo los mismos problemas con otras palabras. Sin la segunda prueba,
 * "no lo nombro esta vez" se confunde con "lo arreglamos", y eso ya extinguio en
 * falso cuatro hallazgos cuyos archivos no habian cambiado un byte (2026-08-08).
 *
 * El cambio de archivo no demuestra que el fix sea correcto — demuestra que
 * ALGUIEN TOCO el sitio. Es la prueba minima que separa un arreglo de un olvido,
 * y falla del lado de conservar: ante la duda, el hallazgo sigue vivo.
 */
export function isExtinct(finding: FindingMemory, evidence: ExtinctionEvidence): boolean {
  return !evidence.reported.has(finding.identity) && evidence.touched.has(finding.identity)
}

/**
 * Los hallazgos que hoy pasan las dos pruebas. Los ya extintos no se vuelven a
 * mirar: extinguir es una transicion, no un estado que se recalcule cada vez.
 */
export function extinguishable(
  memory: readonly FindingMemory[],
  evidence: ExtinctionEvidence
): readonly FindingMemory[] {
  return memory.filter((f) => f.lifecycle === 'ACTIVE' && isExtinct(f, evidence))
}

/**
 * Ausentes que NO se extinguen: el escaneo no los nombro pero nadie toco su
 * archivo. Siguen vivos. Se listan aparte para poder DECIRLO en vez de que
 * desaparezcan en silencio, que es como empezo el problema.
 */
export function unreported(
  memory: readonly FindingMemory[],
  evidence: ExtinctionEvidence
): readonly FindingMemory[] {
  return memory.filter(
    (f) =>
      f.lifecycle === 'ACTIVE' &&
      !evidence.reported.has(f.identity) &&
      !evidence.touched.has(f.identity)
  )
}
