import type { Project } from '@domain/project/project'
import type { CampanaDeclarada } from '@domain/scan/campana-declarada'
import type { MotivoCierre } from '@domain/scan/motivo-cierre'
import { nowIso } from '@domain/shared/id'
import type { AppContext } from '../context'
import type { Acumulado } from './acumulador-del-recorrido'
import { cerrarEscaneo } from './cerrar-escaneo'
import type { ScanSummary } from './scan-types'

export type Cerrar = (motivo: MotivoCierre, acumulado: Acumulado, extra?: string) => ScanSummary

/**
 * El cierre del recorrido, con la fila ya elegida. La cobertura sale del
 * ACUMULADO —lo que de verdad se auditó— y no del manifiesto, que es lo que
 * hace que un recorrido cortado no pueda decir 100 %.
 */
/** Los totales que el manifiesto fijo: la Y de «X de Y», y las XX prometidas. */
export interface TotalesDelRecorrido {
  readonly paradasTotal: number
  readonly ficherosTotal: number | null
  /** La campana declarada, del mismo manifiesto que fijo los totales. */
  readonly campana: CampanaDeclarada
  /** Cuando se abrio la fila. De aqui sale el reloj de pared del escaneo. */
  readonly startedAt: string
}

/** El reloj de pared. Nunca negativo: un reloj que retrocede no resta tiempo. */
const transcurrido = (desde: string, hasta: string): number =>
  Math.max(0, Date.parse(hasta) - Date.parse(desde))

export function crearCierre(
  context: AppContext,
  project: Project,
  scanId: string,
  totales: TotalesDelRecorrido
): Cerrar {
  return (motivo, acumulado) => {
    const at = nowIso()
    return cerrarEscaneo(context, project, {
      scanId,
      reportados: acumulado.reportados,
      paradasHechas: acumulado.hechas,
      paradasTotal: totales.paradasTotal,
      ficherosCubiertos: acumulado.cubiertos,
      ficherosTotal: totales.ficherosTotal,
      // Lo declarado por el manifiesto MAS lo que de verdad corrio.
      modulos: { ...totales.campana, temasCorridos: acumulado.temas },
      motivo,
      at,
      durationMs: acumulado.durationMs,
      transcurridoMs: transcurrido(totales.startedAt, at),
      usage: acumulado.usage,
      tools: acumulado.tools,
      edits: acumulado.edits
    })
  }
}
