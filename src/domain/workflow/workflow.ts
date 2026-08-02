import type { AgentId } from '../agent/agent'

export const WORKFLOW_IDS = [
  'seguridad',
  'limpieza',
  'bugs',
  'tests',
  'produccion',
  'libre'
] as const

export type WorkflowId = (typeof WORKFLOW_IDS)[number]

export interface WorkflowStep {
  readonly agentId: AgentId
  /** Lo que se le encarga a ese agente dentro del workflow. */
  readonly task: string
  /**
   * Un paso con puerta detiene el workflow si encuentra algun CRITICAL. Solo
   * lo lleva seguridad: seguir limpiando o editando sobre un CRITICAL abierto
   * es trabajar encima de un agujero.
   */
  readonly gate?: boolean
}

export interface Workflow {
  readonly id: WorkflowId
  readonly label: string
  readonly steps: readonly WorkflowStep[]
}

/** Cognition cierra SIEMPRE: es quien registra lo aprendido en la sesion. */
export const CLOSING_STEP: WorkflowStep = {
  agentId: 'cognition',
  task:
    'Resume lo que han encontrado los agentes anteriores en esta sesion, identifica ' +
    'patrones que se repitan y propon una defensa permanente para cada uno.'
}
