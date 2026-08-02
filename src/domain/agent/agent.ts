/** Identificadores de los agentes especializados definidos en CLAUDE.md. */
export const AGENT_IDS = [
  'security-reviewer',
  'code-reviewer',
  'refactor-cleaner',
  'tdd-guide',
  'planner',
  'cognition',
  'build-error-resolver',
  'e2e-runner',
  'code-simplifier',
  'opensource-sanitizer'
] as const

export type AgentId = (typeof AGENT_IDS)[number]

import type { IconName } from '../shared/icon-name'

export interface Agent {
  readonly id: AgentId
  /** Nombre semantico del icono; presentacion decide con que se dibuja. */
  readonly iconName: IconName
  readonly name: string
  /** Que hace el agente, en una linea. */
  readonly purpose: string
  /** Si aparece habilitado la primera vez que se abre la app. */
  readonly enabledByDefault: boolean
}
