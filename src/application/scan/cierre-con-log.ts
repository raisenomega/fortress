import type { Project } from '@domain/project/project'
import type { ScanLogWriter } from '@domain/scan/scan-log'
import type { AppContext } from '../context'
import { crearCierre, type Cerrar } from './pasos-del-recorrido'

/**
 * El cierre, dejando SIEMPRE la transcripcion en disco: termine bien, lo pare
 * el operador o reviente. De un escaneo que muere es justo del que hace falta
 * poder leer que dijo antes de morir — el silencio de Health Flow.
 *
 * `extra` es lo que dijo el intento que fallo, que no llego al acumulado porque
 * su parada nunca termino.
 */
export function crearCierreConLog(
  context: AppContext,
  project: Project,
  scanId: string,
  scanLog: ScanLogWriter
): Cerrar {
  const cerrar = crearCierre(context, project, scanId)
  return (motivo, acumulado, extra = '') => {
    scanLog.write(scanId, acumulado.texto + extra)
    return cerrar(motivo, acumulado)
  }
}
