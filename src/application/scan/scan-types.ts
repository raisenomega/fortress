import type { SeverityCounts } from '@domain/project/severity-counts'
import type { EstadoFinal } from '@domain/scan/estado-scan'
import type { MotivoCierre } from '@domain/scan/motivo-cierre'

/**
 * Lo que el escaneo declara haber mirado (ADR-082). Es la pieza que convierte
 * «escaneé» en «escaneé, y aquí está la cuenta»: un numero contrastable contra
 * el manifiesto en vez de una impresion.
 *
 * Los ficheros admiten null porque un escaneo de una pieza no mide nada — null
 * es «no consta», y no es lo mismo que cero. Un recorrido cortado trae
 * `cubiertos < total`, y esa diferencia es justo lo que no se puede callar.
 */
export interface CoberturaDeclarada {
  readonly estado: EstadoFinal
  readonly motivoCierre: MotivoCierre
  readonly paradasHechas: number
  readonly paradasTotal: number
  readonly ficherosCubiertos: number | null
  readonly ficherosTotal: number | null
}

/** Lo que la UI necesita saber al terminar un escaneo, sin releer la base. */
export interface ScanSummary {
  readonly projectId: string
  readonly score: number
  readonly scannedAt: string
  readonly durationMs: number
  readonly counts: SeverityCounts
  readonly cobertura: CoberturaDeclarada
}
