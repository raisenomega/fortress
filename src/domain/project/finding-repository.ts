import type { FindingLifecyclePort } from './finding-lifecycle-port'
import type { MemoriaDelTerminalPort } from './memoria-del-terminal-port'
import type { DetectedFinding } from '../scan/detected-finding'
import type { FindingHistoria } from './finding-historia'
import type { FindingMemory } from './finding-memory'
import type { Finding } from './project'
import type { SeverityCounts } from './severity-counts'

/** Puerto de persistencia de hallazgos. La infraestructura lo implementa. */
export interface FindingRepository extends FindingLifecyclePort, MemoriaDelTerminalPort {
  listByProject(projectId: string): readonly Finding[]

  /** Los mismos hallazgos con su expediente: clave, ciclo de vida y fechas. */
  listMemory(projectId: string): readonly FindingMemory[]

  /** Solo lo CERRADO, con de que murio cada uno (ADR-087). */
  listHistoria(projectId: string): readonly FindingHistoria[]

  /** Conteos de todos los proyectos de una vez. Solo hallazgos abiertos: los
   *  descartados no cuentan para el score ni bloquean un push. */
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
    at: string,
    /** Los que conservan su marca de mitigado en vez de volver a ACTIVE.
     *  Omitirlo es el comportamiento de siempre: todo lo re-visto vuelve a
     *  ACTIVE. El unico que lo calcula es el escaneo, que es quien pregunta a
     *  git; a nadie mas le consta que haya nada que conservar. */
    conservados?: ReadonlySet<string>
  ): void
}
