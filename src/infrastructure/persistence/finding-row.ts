import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { Finding } from '@domain/project/project'
import { isSeverity } from '@domain/shared/severity'
import { newId } from '@domain/shared/id'

/** Fila cruda de la tabla findings. */
export interface FindingRow {
  readonly id: string
  readonly project_id: string
  readonly severity: string
  readonly title: string
  readonly file: string
  readonly line: number | null
}

/** Parametros con nombre del INSERT. */
export interface FindingInsert {
  readonly id: string
  readonly projectId: string
  readonly severity: string
  readonly title: string
  readonly file: string
  readonly line: number | null
  readonly createdAt: string
}

/**
 * La columna lleva un CHECK con las cuatro severidades, asi que el fallback no
 * deberia alcanzarse nunca; esta por si alguien edita la base a mano. Se elige
 * MEDIUM porque ni esconde el hallazgo ni bloquea un push por un dato corrupto.
 */
export function toFinding(row: FindingRow): Finding {
  return {
    id: row.id,
    severity: isSeverity(row.severity) ? row.severity : 'MEDIUM',
    title: row.title,
    file: row.file,
    line: row.line
  }
}

export function toInsert(
  projectId: string,
  finding: DetectedFinding,
  createdAt: string
): FindingInsert {
  return { id: newId(), projectId, createdAt, ...finding }
}
