import type { ObservationKind, ObservationStatus, SelfObservation } from '@domain/system/self-observation' // prettier-ignore

/** Fila cruda del backlog de auto-mejora. */
export interface Row {
  readonly id: string
  readonly source_project: string
  readonly kind: string
  readonly area: string
  readonly note: string
  readonly status: string
  readonly reason: string | null
  readonly attended_by: string | null
  readonly attended_at: string | null
  readonly created_at: string
}

/** `resolved` no se lee: sigue en la tabla por ADR-036, no en el modelo. */
export function toObs(row: Row): SelfObservation {
  return {
    id: row.id,
    sourceProject: row.source_project,
    kind: row.kind as ObservationKind,
    area: row.area,
    note: row.note,
    status: row.status as ObservationStatus,
    reason: row.reason,
    attendedBy: row.attended_by,
    attendedAt: row.attended_at,
    createdAt: row.created_at
  }
}
