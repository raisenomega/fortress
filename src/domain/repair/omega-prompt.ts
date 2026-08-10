import type { Analysis } from './analysis'

export interface OmegaFile {
  readonly path: string
  readonly content: string
}

export interface OmegaPromptInput {
  readonly analysis: Analysis
  readonly diffText: string
  readonly filesPost: readonly OmegaFile[]
  readonly filesPre: readonly OmegaFile[]
}

/** Los campos del analisis son dato, no ordenes: se neutralizan las marcas. */
function safe(text: string): string {
  return text.replace(/</g, '(').replace(/>/g, ')').replace(/`/g, "'")
}

/** El contenido de los archivos va SIN escapar: es el objeto de la revision. */
function files(tag: string, list: readonly OmegaFile[]): string[] {
  return list.flatMap((file) => [`--- ${tag}: ${file.path} ---`, file.content])
}

/**
 * I4 — OMEGA, revisor semantico independiente: juzga si el fix resuelve el
 * hallazgo sin dano colateral. No edita, no ejecuta — solo veredicto, en un
 * bloque VERDICT:{...}:END-VERDICT con los 6 ejes + razon.
 */
export function buildOmegaPrompt(input: OmegaPromptInput): string {
  const a = input.analysis
  return [
    'Eres OMEGA, revisor semantico INDEPENDIENTE del motor de reparacion.',
    'Juzgas si el fix resuelve el hallazgo sin dano colateral. No editas, no',
    'ejecutas: SOLO el veredicto.',
    '',
    '<hallazgo>',
    `titulo: ${safe(a.target.title)}`,
    `archivo: ${safe(a.target.file)}:${a.target.line ?? ''}`,
    '</hallazgo>',
    '<analisis>',
    `QUE_CAMBIAR: ${safe(a.whatToChange)}`,
    `DONDE: ${safe(a.where)}`,
    `PATRON: ${safe(a.patternToCopy)}`,
    `NO_TOCAR: ${safe(a.doNotTouch)}`,
    `RIESGO: ${safe(a.risk)}`,
    '</analisis>',
    '',
    '=== DIFF DEL FIX ===',
    input.diffText,
    ...files('PRE (base)', input.filesPre),
    ...files('POST (fix)', input.filesPost),
    '',
    'Responde SOLO con el bloque siguiente, sin texto fuera de el:',
    'VERDICT:{"resuelve_el_hallazgo":"SI|NO|PARCIAL","respeta_scope":"SI|NO",',
    '"respeta_doNotTouch":"SI|NO","calidad_del_diff":"BUENO|ACEPTABLE|RUIDOSO",',
    '"riesgo_residual":"NINGUNO|MENOR|MAYOR","veredicto_global":"APROBADO|VETADO",',
    '"razon":"1-3 lineas"}:END-VERDICT'
  ].join('\n')
}
