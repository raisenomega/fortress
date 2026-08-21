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
    at: string,
    /** Los que conservan su marca de mitigado en vez de volver a ACTIVE.
     *  Omitirlo es el comportamiento de siempre: todo lo re-visto vuelve a
     *  ACTIVE. El unico que lo calcula es el escaneo, que es quien pregunta a
     *  git; a nadie mas le consta que haya nada que conservar. */
    conservados?: ReadonlySet<string>
  ): void

  /**
   * Cierra el ciclo de vida de los hallazgos indicados, con fecha. Solo lo
   * llama quien ya reunio la evidencia de las DOS pruebas de la extincion:
   * ausencia en el escaneo Y archivo tocado desde la primera deteccion.
   */
  markExtinct(ids: readonly string[], at: string): void

  /**
   * El operador declara que un hallazgo ya esta ARREGLADO, con una nota que
   * dice donde. No afirma que haya desaparecido —eso lo confirma el escaneo con
   * su doble prueba—, asi que el hallazgo sigue en el tablero; lo que deja es de
   * pedirle trabajo al motor. false si ya no estaba ACTIVE.
   */
  markMitigated(findingId: string, note: string, at: string): boolean

  /** El operador deshace su marca: el hallazgo vuelve a la cola. false si no
   *  estaba mitigado. */
  markActive(findingId: string): boolean

  /** Marca un hallazgo como falso positivo y recuerda la decision. */
  dismiss(findingId: string): boolean

  /** Deshace el descarte y vuelve a contar el hallazgo. */
  reopen(findingId: string): boolean
}
