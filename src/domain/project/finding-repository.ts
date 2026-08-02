import type { DetectedFinding } from '../scan/detected-finding'
import type { Finding } from './project'
import type { SeverityCounts } from './severity-counts'

/** Puerto de persistencia de hallazgos. La infraestructura lo implementa. */
export interface FindingRepository {
  listByProject(projectId: string): readonly Finding[]
  /** Conteos de todos los proyectos de una vez: las tarjetas los piden juntos. */
  countsByProject(): Readonly<Record<string, SeverityCounts>>
  /**
   * Sustituye los hallazgos del proyecto por los del ultimo escaneo. No se
   * acumulan: un hallazgo arreglado tiene que desaparecer del tablero, y solo
   * el escaneo mas reciente describe el estado actual del codigo.
   */
  replaceForProject(projectId: string, findings: readonly DetectedFinding[]): void
}
