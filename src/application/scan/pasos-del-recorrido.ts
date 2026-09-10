import type { Project } from '@domain/project/project'
import type { Parada } from '@domain/scan/manifiesto'
import type { MotivoCierre } from '@domain/scan/motivo-cierre'
import type { Scanner } from '@domain/scan/scanner'
import { nowIso } from '@domain/shared/id'
import type { AppContext } from '../context'
import type { Acumulado } from './acumulador-del-recorrido'
import { cerrarEscaneo } from './cerrar-escaneo'
import type { ProgresoDelRecorrido } from './progreso-del-recorrido'
import type { ScanSummary } from './scan-types'

/**
 * Una parada, escaneada entera. Las `rutas` acotan la pasada en el prompt; el
 * `projectPath` sigue siendo la RAIZ, que es de donde cuelgan el grafo, el
 * corpus y la identidad de los hallazgos (ADR-082, Enmienda 1).
 */
export function escanearParada(
  scanner: Scanner,
  project: Project,
  parada: Parada,
  progreso: ProgresoDelRecorrido
): ReturnType<Scanner['scan']> {
  return scanner.scan(
    {
      projectPath: project.path,
      projectName: project.name,
      projectId: project.id,
      rutas: [parada.carpeta]
    },
    progreso.texto
  )
}

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
}

export function crearCierre(
  context: AppContext,
  project: Project,
  scanId: string,
  totales: TotalesDelRecorrido
): Cerrar {
  return (motivo, acumulado) =>
    cerrarEscaneo(context, project, {
      scanId,
      reportados: acumulado.reportados,
      paradasHechas: acumulado.hechas,
      paradasTotal: totales.paradasTotal,
      ficherosCubiertos: acumulado.cubiertos,
      ficherosTotal: totales.ficherosTotal,
      motivo,
      at: nowIso(),
      durationMs: acumulado.durationMs,
      usage: acumulado.usage,
      tools: acumulado.tools,
      edits: acumulado.edits
    })
}
