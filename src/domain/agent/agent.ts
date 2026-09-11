/** Identificadores de los agentes de auditoria. Fuente publica: docs/AGENTS.md. */
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
  'opensource-sanitizer',
  'sentinel-omega',
  'scope-classifier'
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
  /**
   * Carta propia que reemplaza al prompt generico. Solo la usan agentes con
   * una identidad que las reglas comunes no capturan (SENTINEL OMEGA). El
   * resto deriva su prompt de name + purpose.
   */
  readonly charter?: string
  /**
   * Alias o id de modelo para este agente. Ausente = hereda el de la sesion.
   * Alias (`opus`, `sonnet`, `haiku`) y no un id fijo: asi el agente sube de
   * version sola cuando sale la siguiente, sin tocar el catalogo.
   */
  readonly model?: string
}
