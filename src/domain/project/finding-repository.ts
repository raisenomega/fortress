import type { DetectedFinding } from '../scan/detected-finding'
import type { FindingMemory } from './finding-memory'
import type { Finding } from './project'
import type { SeverityCounts } from './severity-counts'

/** Puerto de persistencia de hallazgos. La infraestructura lo implementa. */
export interface FindingRepository {
  listByProject(projectId: string): readonly Finding[]

  /** Los mismos hallazgos con su expediente: clave, ciclo de vida y fechas. */
  listMemory(projectId: string): readonly FindingMemory[]

  /**
   * Conteos de todos los proyectos de una vez. Solo hallazgos abiertos: los
   * descartados no cuentan para el score ni bloquean un push.
   */
  countsByProject(): Readonly<Record<string, SeverityCounts>>

  /**
   * Vuelca lo que vio un escaneo SIN BORRAR nada. Por cada hallazgo reportado:
   * si ya existia (misma clave estable) se refresca y se le pone `lastSeen`;
   * si es nuevo, entra con `firstSeen`. Los que el escaneo NO nombro se quedan
   * donde estan, con su `lastSeen` viejo — ausentes, que no es lo mismo que
   * resueltos. Decidir si un ausente esta extinto NO es cosa de la escritura.
   *
   * Antes esto BORRABA las filas anteriores. Por eso no habia memoria: un
   * hallazgo que el escaner dejaba de nombrar se eliminaba, y la unica forma de
   * saber si seguia vivo era adivinar por ausencia.
   *
   * Los que el operador ya habia descartado entran ya descartados.
   */
  syncFromScan(
    projectId: string,
    scanId: string,
    findings: readonly DetectedFinding[],
    at: string
  ): void

  /** Marca un hallazgo como falso positivo y recuerda la decision. */
  dismiss(findingId: string): boolean

  /** Deshace el descarte y vuelve a contar el hallazgo. */
  reopen(findingId: string): boolean
}
