import type { DetectedFinding } from '../scan/detected-finding'
import type { Finding } from './project'
import type { SeverityCounts } from './severity-counts'

/** Puerto de persistencia de hallazgos. La infraestructura lo implementa. */
export interface FindingRepository {
  listByProject(projectId: string): readonly Finding[]

  /**
   * Conteos de todos los proyectos de una vez. Solo hallazgos abiertos: los
   * descartados no cuentan para el score ni bloquean un push.
   */
  countsByProject(): Readonly<Record<string, SeverityCounts>>

  /**
   * Sustituye los hallazgos del proyecto por los del ultimo escaneo. No se
   * acumulan: un hallazgo arreglado tiene que desaparecer del tablero, y solo
   * el escaneo mas reciente describe el estado actual del codigo. Los que el
   * operador ya habia descartado entran ya descartados.
   */
  replaceForProject(projectId: string, scanId: string, findings: readonly DetectedFinding[]): void

  /** Marca un hallazgo como falso positivo y recuerda la decision. */
  dismiss(findingId: string): boolean

  /** Deshace el descarte y vuelve a contar el hallazgo. */
  reopen(findingId: string): boolean
}
