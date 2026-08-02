import { findAgent } from '../agent/agent-catalog'
import type { AgentId } from '../agent/agent'
import type { Workflow, WorkflowStep } from './workflow'

export interface PlannedStep {
  readonly step: WorkflowStep
  /** Excluido por el operador desde el sidebar. */
  readonly excluded: boolean
}

export interface WorkflowPlan {
  readonly workflow: Workflow
  readonly steps: readonly PlannedStep[]
  /** Pasos que si se van a ejecutar. */
  readonly active: readonly WorkflowStep[]
  readonly warnings: readonly string[]
}

function warn(agentId: AgentId): string {
  const nombre = findAgent(agentId)?.name ?? agentId
  return `${nombre} esta desactivado. Su parte del workflow no se ejecutara.`
}

/**
 * Los interruptores del sidebar EXCLUYEN. Un agente apagado no participa, pero
 * su ausencia se avisa en vez de callarse: un informe al que le falta la parte
 * de seguridad no es un informe de seguridad, y hay que decirlo.
 */
export function planWorkflow(workflow: Workflow, excluded: readonly AgentId[]): WorkflowPlan {
  const steps = workflow.steps.map((step) => ({
    step,
    excluded: excluded.includes(step.agentId)
  }))

  return {
    workflow,
    steps,
    active: steps.filter((planned) => !planned.excluded).map((planned) => planned.step),
    warnings: steps
      .filter((planned) => planned.excluded)
      .map((planned) => warn(planned.step.agentId))
  }
}
