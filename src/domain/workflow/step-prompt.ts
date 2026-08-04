import { REPORT_CONTRACT } from '../scan/report-contract'
import { SCAN_RULES } from '../scan/scan-checklist'
import { graphFirstFor } from '../settings/graph-first'
import { MODE_INSTRUCTION, type OperationMode } from '../settings/operation-mode'
import { SELF_VERIFY } from '../settings/self-verify'
import type { WorkflowStep } from './workflow'

export interface StepContext {
  readonly projectName: string
  /** Lo que ya han encontrado los pasos anteriores de ESTA revision. */
  readonly previous: readonly string[]
  /**
   * Hallazgos que FORTRESS ya tiene guardados de escaneos anteriores. Sin
   * esto el agente empieza de cero cada vez: preguntarle "que viste en el
   * ultimo escaneo" le hacia volver a escanear el proyecto entero.
   */
  readonly known: readonly string[]
  /** El modo en el que trabaja. Sin esto el agente decia "supervisado" siempre. */
  readonly mode: OperationMode
}

/**
 * Cada paso recibe lo que encontraron los anteriores. Sin eso, el Code Reviewer
 * volveria a reportar la inyeccion SQL que el Security Reviewer acaba de
 * senalar, y el informe consolidado saldria con todo duplicado.
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

export function buildStepPrompt(step: WorkflowStep, context: StepContext): string {
  return [
    `Proyecto "${context.projectName}", que es el directorio de trabajo actual.`,
    '',
    MODE_INSTRUCTION[context.mode],
    '',
    graphFirstFor(step.agentId),
    '',
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
