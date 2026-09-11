import type { ParadaRunRepository } from '@domain/telemetry/parada-run-repository'

/**
 * Lo que FORTRESS mide de su propio trabajo, aparte del mapa de repositorios
 * porque contesta otra clase de pregunta: no «que hay guardado del proyecto»
 * sino «como se comporto la herramienta al mirarlo».
 */
export interface Telemetria {
  /**
   * La serie por PARADA de un escaneo (ADR-082). Vive en su propia tabla y no
   * en `runs` a proposito: alli cuatro consultas cuentan filas, y de ellas
   * cuelgan el compliance del superdashboard y el score de OMEGA sobre el
   * escaner. Doce filas por escaneo habrian movido los dos sin que nadie
   * tocara el escaner.
   */
  readonly paradaRuns: ParadaRunRepository
}
