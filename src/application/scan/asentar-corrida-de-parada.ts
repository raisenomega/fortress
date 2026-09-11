import type { Project } from '@domain/project/project'
import { rotuloDe, type Parada } from '@domain/scan/parada'
import type { ScanOutcome } from '@domain/scan/scanner'
import type { AppContext } from '../context'

/** Donde va la fila y de que parada habla. Junto, porque una serie sin su
 *  indice no es una serie: es un monton de filas del mismo escaneo. */
export interface SitioDeLaParada {
  readonly scanId: string
  readonly indice: number
  readonly at: string
}

/**
 * Deja constancia de lo que costo UNA parada: su duracion, su factura y sus
 * turnos, tal y como salieron de ESA pasada y antes de fundirse en el acumulado.
 *
 * Es lo que convierte el agregado en una SERIE. Con una sola fila por escaneo
 * —la suma de las doce— la pregunta «¿degrado el agente de la parada 1 a la
 * 12?» no tiene respuesta en la base: una media no distingue doce paradas
 * parejas de seis cortas y seis desbocadas. Con la serie, se ve.
 *
 * Va a `scan_parada_runs` y NO a `agent_runs`, y esa es la decision que lo hace
 * barato: alli cuatro consultas CUENTAN filas, y de ellas cuelgan el compliance
 * del superdashboard y el score de OMEGA sobre el escaner. Ademas el gasto
 * diario se lee solo de `agent_runs`, asi que esta tabla no puede contarlo dos
 * veces por mucho que crezca.
 *
 * Mejor esfuerzo, molde `recordChatRun`: perder una fila de telemetria es
 * molesto; perder la parada que el operador acaba de pagar, no.
 */
export function asentarCorridaDeParada(
  context: AppContext,
  project: Project,
  parada: Parada,
  sitio: SitioDeLaParada,
  salida: ScanOutcome
): void {
  try {
    context.paradaRuns.record({
      scanId: sitio.scanId,
      projectId: project.id,
      paradaIndice: sitio.indice,
      paradaRotulo: rotuloDe(parada),
      durationMs: salida.durationMs,
      usage: salida.usage,
      at: sitio.at
    })
  } catch (error) {
    console.error('[scan] no se pudo asentar la corrida de la parada', sitio.scanId, error)
  }
}
