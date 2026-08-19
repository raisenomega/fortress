import type { Analysis } from './analysis'
import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { buildDocsFirst } from '../settings/docs-first-compose'

/** El texto del analisis es dato, no ordenes: se neutraliza lo que rompe marcas. */
function safe(text: string): string {
  return text.replace(/</g, '(').replace(/>/g, ')').replace(/`/g, "'")
}

const RULES = [
  '- UN hallazgo, UN fix: el diff minimo que resuelva el problema.',
  '- Aplica QUE_CAMBIAR en DONDE. Copia el PATRON si aplica. NO toques NO_TOCAR.',
  '- SOLO puedes editar los archivos de PERMITIDOS. Ningun otro.',
  '- NO corras git (ni add, ni commit): el commit lo hace el motor por fuera.',
  '- Sin explicaciones ni sugerencias al final: el fix habla por si mismo.',
  '- Respeta el estilo del repo: limite de lineas, sin any, cero emojis.'
].join('\n')

/**
 * Prompt de C3 — GENERAR: el agente EDITA en el worktree aislado, guiado por el
 * entendimiento de C2. Los campos del analisis van delimitados y neutralizados:
 * describen el problema, jamas instruyen al generador.
 */
export function buildGeneratorPrompt(
  analysis: Analysis,
  corpus: CorpusDescriptor,
  allowed: readonly string[],
  allows: readonly string[] = []
): string {
  // Escribir el fix es decidir DONDE va y que patron copiar: eso es estructural
  // (ver docs-first), y las decisiones ya firmadas del proyecto mandan sobre el.
  const docs = buildDocsFirst('structural', corpus)
  return [
    'Modo REPARACION (C3). Trabajas en una COPIA aislada del repo: genera el fix.',
    '',
    '<hallazgo>',
    `titulo: ${safe(analysis.target.title)}`,
    `archivo: ${safe(analysis.target.file)}:${analysis.target.line ?? ''}`,
    '</hallazgo>',
    '<analisis>',
    `QUE_CAMBIAR: ${safe(analysis.whatToChange)}`,
    `DONDE: ${safe(analysis.where)}`,
    `PATRON: ${safe(analysis.patternToCopy)}`,
    `NO_TOCAR: ${safe(analysis.doNotTouch)}`,
    `RIESGO: ${safe(analysis.risk)}`,
    '</analisis>',
    '<permitidos>',
    ...allowed.map((file) => `- ${file}`),
    // Los globs del grupo van con su forma: enumerarlos seria mentir sobre lo
    // que abarcan, y el generador necesita saber que puede CREAR ahi dentro.
    ...allows.map((glob) => `- ${glob} (puedes crear archivos aqui)`),
    '</permitidos>',
    '',
    ...(docs === '' ? [] : [docs, '']),
    'Reglas:',
    RULES
  ].join('\n')
}
