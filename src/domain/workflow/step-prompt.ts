import { REPORT_CONTRACT } from '../scan/report-contract'
import { SCAN_RULES } from '../scan/scan-checklist'
import type { WorkflowStep } from './workflow'

export interface StepContext {
  readonly projectName: string
  /** Lo que ya han encontrado los pasos anteriores, resumido. */
  readonly previous: readonly string[]
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

export function buildStepPrompt(step: WorkflowStep, context: StepContext): string {
  return [
    `Proyecto "${context.projectName}", que es el directorio de trabajo actual.`,
    '',
    `Tu encargo: ${step.task}`,
    '',
    describePrevious(context.previous),
    '',
    'Reglas:',
    SCAN_RULES,
    '',
    REPORT_CONTRACT
  ].join('\n')
}
