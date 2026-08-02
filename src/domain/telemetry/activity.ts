import type { AgentId } from '../agent/agent'
import type { DetectedFinding } from '../scan/detected-finding'
import type { Severity } from '../shared/severity'

export const ACTIVITY_KINDS = ['scan', 'chat', 'finding', 'edit', 'push', 'dismiss'] as const

export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

export function isActivityKind(value: unknown): value is ActivityKind {
  return typeof value === 'string' && (ACTIVITY_KINDS as readonly string[]).includes(value)
}

export interface NewActivity {
  readonly projectId: string
  readonly agentId: AgentId | null
  readonly kind: ActivityKind
  /** Una frase, ya redactada. La UI pinta, no interpreta. */
  readonly summary: string
  readonly severity: Severity | null
  readonly file: string
  readonly line: number | null
}

export interface Activity extends NewActivity {
  readonly id: string
  readonly at: string
}

/** Puerto del registro de actividad. */
export interface ActivityRepository {
  recordMany(entries: readonly NewActivity[]): void
  listByProject(projectId: string, limit: number): readonly Activity[]
  /** Historial de un agente; con projectId en null, en todos los proyectos. */
  listByAgent(agentId: AgentId, projectId: string | null, limit: number): readonly Activity[]
  /** Hallazgos distintos que el agente reporto alguna vez en el proyecto. */
  reportedFindings(agentId: AgentId, projectId: string): readonly DetectedFinding[]
}
