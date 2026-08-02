import type { AgentId } from '../agent/agent'
import type { Severity } from '../shared/severity'
import type { Activity, ActivityKind } from './activity'

export interface ActivityFilter {
  readonly agentId: AgentId | null
  readonly severity: Severity | null
  readonly kind: ActivityKind | null
}

export const NO_FILTER: ActivityFilter = { agentId: null, severity: null, kind: null }

/**
 * Null significa "no filtres por esto", no "sin valor". La diferencia importa
 * en la severidad: filtrar por CRITICAL debe esconder las entradas que no
 * tienen severidad, y no filtrar debe ensenarlas todas.
 */
export function filterActivity(
  entries: readonly Activity[],
  filter: ActivityFilter
): readonly Activity[] {
  return entries.filter((entry) => {
    if (filter.agentId !== null && entry.agentId !== filter.agentId) return false
    if (filter.kind !== null && entry.kind !== filter.kind) return false
    if (filter.severity !== null && entry.severity !== filter.severity) return false
    return true
  })
}

export function isFiltering(filter: ActivityFilter): boolean {
  return filter.agentId !== null || filter.severity !== null || filter.kind !== null
}
