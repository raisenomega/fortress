import { REPORT_CONTRACT } from '../scan/report-contract'
import { SCAN_RULES } from '../scan/scan-checklist'
import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { categoryForAgent } from '../settings/docs-first'
import { buildDocsFirst } from '../settings/docs-first-compose'
import { graphFirstFor } from '../settings/graph-first'
import { MODE_INSTRUCTION, type OperationMode } from '../settings/operation-mode'
import { SELF_VERIFY } from '../settings/self-verify'
import type { WorkflowStep } from './workflow'

export interface StepContext {
  readonly projectName: string
  readonly corpus: CorpusDescriptor
  /** Lo que ya han encontrado los pasos anteriores de ESTA revision. */
  readonly previous: readonly string[]
  /** Hallazgos guardados de escaneos anteriores: sin esto empieza de cero. */
  readonly known: readonly string[]
  /** El modo en el que trabaja. Sin esto el agente decia "supervisado" siempre. */
  readonly mode: OperationMode
}

/**
 * Cada paso recibe lo que encontraron los anteriores: sin eso el informe
 * consolidado saldria con la misma inyeccion SQL reportada tres veces.
 */
function describePrevious(previous: readonly string[]): string {
  if (previous.length === 0) return 'Eres el primer agente de esta revision.'

  return [
    'Lo que ya han reportado los agentes anteriores en esta misma revision:',
    ...previous.map((line) => `- ${line}`),
    'NO vuelvas a reportar esos hallazgos. Aporta solo lo tuyo.'
  ].join('\n')
}

function describeKnown(known: readonly string[]): string {
  if (known.length === 0) return 'FORTRESS no tiene ningun escaneo previo de este proyecto.'

  return [
    'FORTRESS ya tiene registrados estos hallazgos de un escaneo anterior:',
    ...known.map((line) => `- ${line}`),
    'Si el operador pregunta por el ultimo escaneo, responde con ESTO: ya esta medido,',
    'no hace falta volver a escanear. Vuelve a mirar el codigo solo si te lo piden.'
  ].join('\n')
}

/** El bloque documental, y su linea en blanco, solo si el proyecto tiene corpus. */
function docsFirst(agentId: WorkflowStep['agentId'], context: StepContext): readonly string[] {
  const bloque = buildDocsFirst(categoryForAgent(agentId), context.corpus)
  return bloque === '' ? [] : [bloque, '']
}

export function buildStepPrompt(step: WorkflowStep, context: StepContext): string {
  return [
    `Proyecto "${context.projectName}", que es el directorio de trabajo actual.`,
    '',
    MODE_INSTRUCTION[context.mode],
    '',
    graphFirstFor(step.agentId),
    '',
    ...docsFirst(step.agentId, context),
    describeKnown(context.known),
    '',
    `Tu encargo: ${step.task}`,
    '',
    describePrevious(context.previous),
    '',
    'Reglas:',
    SCAN_RULES,
    '',
    SELF_VERIFY,
    '',
    REPORT_CONTRACT
  ].join('\n')
}
