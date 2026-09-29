import { sanearCampoDePrompt } from '../shared/sanear-campo-de-prompt'
import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { categoryForAgent } from '../settings/docs-first'
import { NOTAS_COMO_CLAVE } from '../system/peticion-de-notas'
import { buildDocsFirst } from '../settings/docs-first-compose'
import type { HallazgoJuzgado } from './hallazgo-juzgado'

export interface OmegaFile {
  readonly path: string
  readonly content: string
}

export interface OmegaPromptInput {
  /** La doctrina del proyecto auditado, para juzgar con lo que el ya firmo. */
  readonly corpus: CorpusDescriptor
  readonly analysis: HallazgoJuzgado
  readonly diffText: string
  readonly filesPost: readonly OmegaFile[]
  readonly filesPre: readonly OmegaFile[]
  /** Lo que el MOTOR ya sabia: la correa que aplico y el gate. Se LEE del libro
   *  de la propuesta (ver `loQueElMotorSupo`); ausente en el Terminal, que no
   *  tiene propuesta ni correa que ensenar. */
  readonly motorSupo?: readonly string[]
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
  // Su categoria no se elige aqui: OMEGA ya esta en el catalogo de agentes y
  // categoryForAgent dice cual le toca. Inventarle una seria una segunda tabla.
  const docs = buildDocsFirst(categoryForAgent('sentinel-omega'), input.corpus)
  return [
    'Eres OMEGA, revisor semantico INDEPENDIENTE del motor de reparacion.',
    'Juzgas si el fix resuelve el hallazgo sin dano colateral. No editas, no',
    'ejecutas: SOLO el veredicto.',
    '',
    ...(docs === '' ? [] : [docs, '']),
    '<hallazgo>',
    `titulo: ${sanearCampoDePrompt(a.target.title)}`,
    `archivo: ${sanearCampoDePrompt(a.target.file)}:${a.target.line ?? ''}`,
    '</hallazgo>',
    '<analisis>',
    `QUE_CAMBIAR: ${sanearCampoDePrompt(a.whatToChange)}`,
    `DONDE: ${sanearCampoDePrompt(a.where)}`,
    `PATRON: ${sanearCampoDePrompt(a.patternToCopy)}`,
    `NO_TOCAR: ${sanearCampoDePrompt(a.doNotTouch)}`,
    `RIESGO: ${sanearCampoDePrompt(a.risk)}`,
    '</analisis>',
    ...(input.motorSupo === undefined ? [] : ['<lo-que-el-motor-supo>', ...input.motorSupo, '</lo-que-el-motor-supo>']), // prettier-ignore
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
    '"razon":"1-3 lineas"}:END-VERDICT',
    '',
    NOTAS_COMO_CLAVE,
    'Es OPCIONAL y NO afecta a tu veredicto: si la escribes mal se descarta sola,',
    'y el veredicto se lee igual.'
  ].join('\n')
}
