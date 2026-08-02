import type { CognitionSnapshot } from './cognition-log'
import { parseAttention } from './parse-attention'
import { parsePatterns } from './parse-patterns'
import { parseReflections } from './parse-reflections'
import { findSection, splitSections } from './sections'
import { readNumber, realLines } from './template-guard'

/** Lee COGNITION-LOG.md completo. El contenido es texto, nunca se ejecuta. */
export function parseCognitionLog(markdown: string): CognitionSnapshot {
  const sections = splitSections(markdown)
  const generacion = findSection(sections, 'GENERACION ACTUAL')

  return {
    present: true,
    generation: generacion === null ? null : readNumber(realLines(generacion), /^Generaci/i),
    patterns: parsePatterns(sections),
    attention: parseAttention(findSection(sections, 'MAPA DE ATENCION')),
    reflections: parseReflections(sections)
  }
}
