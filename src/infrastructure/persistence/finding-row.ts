import type { FindingInsert, FindingRow } from './finding-row-types'
import { fingerprintOf } from '@domain/project/finding-fingerprint'
import { findingIdentity } from '@domain/project/finding-identity'
import { isFindingLifecycle } from '@domain/project/finding-lifecycle'
import { isFindingStatus } from '@domain/project/finding-status'
import type { Finding } from '@domain/project/project'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { newId } from '@domain/shared/id'
import { isSeverity } from '@domain/shared/severity'

/** Fila cruda de la tabla findings. */
/**
 * La columna severity lleva un CHECK con las cuatro severidades, asi que ese
 * fallback no deberia alcanzarse nunca; esta por si alguien edita la base a
 * mano. MEDIUM ni esconde el hallazgo ni bloquea un push por un dato corrupto.
 */
export function toFinding(row: FindingRow): Finding {
  return {
    id: row.id,
    severity: isSeverity(row.severity) ? row.severity : 'MEDIUM',
    title: row.title,
    file: row.file,
    line: row.line,
    status: isFindingStatus(row.status) ? row.status : 'open',
    lifecycle: isFindingLifecycle(row.lifecycle) ? row.lifecycle : 'ACTIVE',
    mitigatedNote: row.mitigated_note ?? null
  }
}

export function toInsert(
  projectId: string,
  scanId: string,
  finding: DetectedFinding,
  dismissed: ReadonlySet<string>,
  at: string
): FindingInsert {
  const fingerprint = fingerprintOf(finding)

  return {
    id: newId(),
    projectId,
    scanId,
    fingerprint,
    identity: findingIdentity(finding),
    // Un hallazgo ya descartado antes entra descartado: la decision del
    // operador no se pierde porque haya pasado otro escaneo por encima.
    status: dismissed.has(fingerprint) ? 'false_positive' : 'open',
    at,
    ...finding
  }
}

export type { FindingInsert, FindingRow }
