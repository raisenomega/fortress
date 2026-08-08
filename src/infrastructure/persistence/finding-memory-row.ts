import { isFindingLifecycle } from '@domain/project/finding-lifecycle'
import type { FindingMemory } from '@domain/project/finding-memory'
import { isFindingStatus } from '@domain/project/finding-status'
import { isSeverity } from '@domain/shared/severity'

/** Fila cruda con las columnas de memoria. */
export interface MemoryRow {
  readonly id: string
  readonly identity: string
  readonly severity: string
  readonly title: string
  readonly file: string
  readonly line: number | null
  readonly status: string
  readonly lifecycle: string
  readonly first_seen: string
  readonly last_seen: string
  readonly resolved_at: string | null
}

/**
 * Los fallbacks no deberian alcanzarse: las columnas las escribe esta misma
 * capa. Estan por si alguien edita la base a mano, y los tres caen del lado
 * que NO oculta trabajo pendiente: ACTIVE antes que dar por extinto algo vivo.
 */
export function toMemory(row: MemoryRow): FindingMemory {
  return {
    id: row.id,
    identity: row.identity,
    severity: isSeverity(row.severity) ? row.severity : 'MEDIUM',
    title: row.title,
    file: row.file,
    line: row.line,
    status: isFindingStatus(row.status) ? row.status : 'open',
    lifecycle: isFindingLifecycle(row.lifecycle) ? row.lifecycle : 'ACTIVE',
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    resolvedAt: row.resolved_at
  }
}
