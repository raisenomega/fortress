/** Identificadores de los agentes especializados definidos en CLAUDE.md. */
export const AGENT_IDS = [
  'security-reviewer',
  'code-reviewer',
  'refactor-cleaner',
  'tdd-guide',
  'planner',
  'cognition',
  'build-error-resolver',
  'code-simplifier',
  'opensource-sanitizer'
] as const

export type AgentId = (typeof AGENT_IDS)[number]

export interface Agent {
  readonly id: AgentId
  /** Emoji que identifica al agente en la UI. */
  readonly icon: string
  readonly name: string
  /** Que hace el agente, en una linea. */
  readonly purpose: string
  /** Si aparece habilitado la primera vez que se abre la app. */
  readonly enabledByDefault: boolean
}
