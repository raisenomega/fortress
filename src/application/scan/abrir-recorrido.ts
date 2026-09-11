import type { Project } from '@domain/project/project'
import { nowIso } from '@domain/shared/id'
import type { AppContext } from '../context'
import { crearCierreConLog } from './cierre-con-log'
import type { SalidasDelRecorrido } from './progreso-del-recorrido'
import type { Cerrar, TotalesDelRecorrido } from './pasos-del-recorrido'

/** La fila abierta y su cierre ya preparado, con el instante que comparten. */
export interface Recorrido {
  readonly scanId: string
  readonly cerrar: Cerrar
  /** El mismo `at` para la apertura y para los hallazgos: una corrida, una hora. */
  readonly at: string
}

/**
 * Abre la fila del escaneo y deja listo su cierre (ADR-082, cierre partido).
 *
 * Las dos cosas juntas y no sueltas porque comparten los TOTALES: la fila nace
 * prometiendo XX paradas y el cierre declara la cobertura contra esa misma
 * promesa. Pasarlos dos veces por separado era el sitio exacto donde una
 * promesa y su cuenta podian dejar de coincidir.
 */
export function abrirRecorrido(
  context: AppContext,
  project: Project,
  salidas: SalidasDelRecorrido,
  totales: Omit<TotalesDelRecorrido, 'startedAt'>
): Recorrido {
  const at = nowIso()
  const scanId = context.scans.abrir({
    projectId: project.id,
    startedAt: at,
    paradasTotal: totales.paradasTotal,
    ficherosTotal: totales.ficherosTotal
  }).id

  return {
    scanId,
    at,
    cerrar: crearCierreConLog(context, project, scanId, salidas.scanLog, {
      ...totales,
      startedAt: at
    })
  }
}
