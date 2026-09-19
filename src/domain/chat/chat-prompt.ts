import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { hallazgosDelTurno, type HallazgosDelTurno } from './hallazgos-del-prompt'
import { buildDocsFirst } from '../settings/docs-first-compose'
import { GRAPH_FIRST } from '../settings/graph-first'
import { MODE_INSTRUCTION } from '../settings/instruccion-de-modo'
import type { OperationMode } from '../settings/operation-mode'
import { SELF_VERIFY } from '../settings/self-verify'

export interface ChatContext extends HallazgosDelTurno {
  readonly projectName: string
  /** Lo que el proyecto documenta, ya mirado en su disco. */
  readonly corpus: CorpusDescriptor
  readonly mode: OperationMode
}

/**
 * Prompt de conversacion, para una pregunta libre. A diferencia de un escaneo,
 * aqui NO se exige el bloque JSON de hallazgos: la respuesta que quiere el
 * operador es la respuesta a su pregunta, en prosa. Forzar el formato de
 * informe hacia que su respuesta se tirara y pareciera que el agente no veia
 * nada. Ve el proyecto entero (es su directorio de trabajo); responde con
 * evidencia —archivo y linea— cuando aplique.
 */
/** El bloque documental, y la linea en blanco que lo separa, solo si hay corpus. */
function docsFirst(ctx: ChatContext): readonly string[] {
  const bloque = buildDocsFirst('general', ctx.corpus)
  return bloque === '' ? [] : [bloque, '']
}

export function buildChatPrompt(question: string, ctx: ChatContext): string {
  return [
    `Proyecto "${ctx.projectName}", que es tu directorio de trabajo actual.`,
    '',
    MODE_INSTRUCTION[ctx.mode],
    '',
    GRAPH_FIRST,
    '',
    ...docsFirst(ctx),
    hallazgosDelTurno(ctx),
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
