import { matchesGlob } from '../shared/path-glob'
import { sanearCampoDePrompt } from '../shared/sanear-campo-de-prompt'
import type { Analysis } from './analysis'
import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { buildDocsFirst } from '../settings/docs-first-compose'

/** ADR-111 pieza 3: la forma EXACTA que la regla pre-aprueba. El instinto del
 *  generador es `npm install` normal —medido—, que se niega y, de correr,
 *  moriria recompilando nativos. Solo aparece cuando el ancla es package.json
 *  Y el grupo abrio el lock: sin terreno seria mandar a violar la correa. */
const NPM_FORMA = [
  'Dependencias: para subir una, corre EXACTAMENTE',
  '  npm install <paquete>@<version> --save-dev --package-lock-only --ignore-scripts',
  '(quita --save-dev si es de produccion; nada despues de --ignore-scripts).',
  'Es la UNICA forma de npm pre-aprobada: sin esos dos flags al final se niega,',
  'y npm run / npm exec se niegan. El fix es package.json + el lock regenerado.'
]

const fixDeDependencias = (ancla: string, allows: readonly string[]): boolean =>
  ancla.trim() === 'package.json' && allows.some((g) => matchesGlob('package-lock.json', g))

const RULES = [
  '- UN hallazgo, UN fix: el diff minimo que resuelva el problema.',
  '- Aplica QUE_CAMBIAR en DONDE. Copia el PATRON si aplica. NO toques NO_TOCAR.',
  '- SOLO puedes editar los archivos de PERMITIDOS. Ningun otro.',
  '- NO corras git (ni add, ni commit): el commit lo hace el motor por fuera.',
  '- Sin explicaciones ni sugerencias al final: el fix habla por si mismo.',
  '- Respeta el estilo del repo: sin any, cero emojis.',
  '- El lint tumba el fix si pasas de 75 lineas por fichero o de 50 por funcion',
  '  (comentarios y lineas en blanco cuentan), o si una funcion no lleva su',
  '  tipo de retorno explicito. Si no cabe: compacta, o extrae un helper DENTRO de un fichero',
  '  de PERMITIDOS. Un fichero nuevo fuera de PERMITIDOS tumba la propuesta.'
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
    `titulo: ${sanearCampoDePrompt(analysis.target.title)}`,
    `archivo: ${sanearCampoDePrompt(analysis.target.file)}:${analysis.target.line ?? ''}`,
    '</hallazgo>',
    '<analisis>',
    `QUE_CAMBIAR: ${sanearCampoDePrompt(analysis.whatToChange)}`,
    `DONDE: ${sanearCampoDePrompt(analysis.where)}`,
    `PATRON: ${sanearCampoDePrompt(analysis.patternToCopy)}`,
    `NO_TOCAR: ${sanearCampoDePrompt(analysis.doNotTouch)}`,
    `RIESGO: ${sanearCampoDePrompt(analysis.risk)}`,
    '</analisis>',
    '<permitidos>',
    ...allowed.map((file) => `- ${file}`),
    // Los globs del grupo van con su forma: enumerarlos seria mentir sobre lo
    // que abarcan, y el generador necesita saber que puede CREAR ahi dentro.
    ...allows.map((glob) => `- ${glob} (puedes crear archivos aqui)`),
    '</permitidos>',
    '',
    ...(fixDeDependencias(analysis.target.file, allows) ? [...NPM_FORMA, ''] : []),
    ...(docs === '' ? [] : [docs, '']),
    'Reglas:',
    RULES
  ].join('\n')
}
