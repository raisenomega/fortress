import { DOCS_FIRST_GENERAL } from '../settings/docs-first'
import { GRAPH_FIRST } from '../settings/graph-first'
import { MODE_INSTRUCTION, type OperationMode } from '../settings/operation-mode'
import { SELF_VERIFY } from '../settings/self-verify'

export interface ChatContext {
  readonly projectName: string
  readonly known: readonly string[]
  readonly mode: OperationMode
}

function describeKnown(known: readonly string[]): string {
  if (known.length === 0) return 'FORTRESS no tiene escaneos previos de este proyecto.'
  return ['Hallazgos ya registrados de escaneos anteriores:', ...known.map((k) => `- ${k}`)].join(
    '\n'
  )
}

/**
 * Prompt de conversacion, para una pregunta libre. A diferencia de un escaneo,
 * aqui NO se exige el bloque JSON de hallazgos: la respuesta que quiere el
 * operador es la respuesta a su pregunta, en prosa. Forzar el formato de
 * informe hacia que su respuesta se tirara y pareciera que el agente no veia
 * nada. Ve el proyecto entero (es su directorio de trabajo); responde con
 * evidencia —archivo y linea— cuando aplique.
 */
export function buildChatPrompt(question: string, ctx: ChatContext): string {
  return [
    `Proyecto "${ctx.projectName}", que es tu directorio de trabajo actual.`,
    '',
    MODE_INSTRUCTION[ctx.mode],
    '',
    GRAPH_FIRST,
    '',
    DOCS_FIRST_GENERAL,
    '',
    describeKnown(ctx.known),
    '',
    'Pregunta del operador:',
    question,
    '',
    'Respondele directo y con evidencia (archivo y linea si aplica). Es una',
    'conversacion: no hace falta ningun bloque JSON. Actua con el criterio de un',
    'ingeniero/CTO senior de 20 anos: profundidad y estandar de produccion, sin',
    'superficialidad. Si el operador pide algo simple o no tecnico, explicalo en',
    'palabras llanas y con analogias cotidianas.',
    '',
    SELF_VERIFY
  ].join('\n')
}
