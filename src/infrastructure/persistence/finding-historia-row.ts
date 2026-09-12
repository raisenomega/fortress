import type { FindingHistoria } from '@domain/project/finding-historia'
import { isSeverity } from '@domain/shared/severity'

/** Fila cruda de la historia. */
export interface HistoriaRow {
  readonly id: string
  readonly severity: string
  readonly title: string
  readonly file: string
  readonly line: number | null
  readonly first_seen: string
  readonly resolved_at: string | null
  readonly extinct_reason: string | null
  readonly extinguido_por: string | null
}

/**
 * El motivo y el quien viajan CRUDOS y sin sanear: la clase se deriva de ellos
 * donde se pinta, y un centinela aqui perderia de que fila es una fusion.
 *
 * La severidad si cae a `MEDIUM` como en `toMemory`, por lo mismo: es lo unico
 * que la pantalla no sabria pintar, y el chip tiene que salir igual.
 */
export function toHistoria(row: HistoriaRow): FindingHistoria {
  return {
    id: row.id,
    severity: isSeverity(row.severity) ? row.severity : 'MEDIUM',
    title: row.title,
    file: row.file,
    line: row.line,
    firstSeen: row.first_seen,
    resolvedAt: row.resolved_at,
    extinctReason: row.extinct_reason,
    extinguidoPor: row.extinguido_por
  }
}
