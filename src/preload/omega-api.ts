import type { OmegaAuditReport } from '@domain/omega/audit-report'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import type { OmegaScore } from '@domain/omega/omega-score'
import type { Result } from '@domain/shared/result'

/** Contrato de SENTINEL OMEGA en el puente. Auditar y leer; jamas borrar. */
export interface OmegaApi {
  /** OMEGA verifica los hallazgos contra el disco y escribe en el Libro de la Vida. */
  audit(projectId: string): Promise<Result<OmegaAuditReport>>
  /** Lee el Libro de la Vida del proyecto. Solo lectura: nunca se borra. */
  list(projectId: string): Promise<readonly OmegaEntry[]>
  /** Puntuacion de integridad con datos reales (veracidad, cumplimiento). */
  score(projectId: string): Promise<Result<OmegaScore>>
}
