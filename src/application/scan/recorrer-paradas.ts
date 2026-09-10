import type { Project } from '@domain/project/project'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { ordenarPorSensibilidad } from '@domain/scan/prioridad-de-paradas'
import type { Scanner } from '@domain/scan/scanner'
import { err, ok, type Result } from '@domain/shared/result'
import { nowIso } from '@domain/shared/id'
import type { AppContext } from '../context'
import { NADA_RECORRIDO, sumarParada } from './acumulador-del-recorrido'
import { asentarHallazgos } from './asentar-hallazgos'
import { crearCierre, escanearParada } from './pasos-del-recorrido'
import type { ProgresoDelRecorrido } from './progreso-del-recorrido'
import type { ScanSummary } from './scan-types'

/**
 * Lo UNICO que corta el recorrido: el operador. Sin tope de gasto, sin tope de
 * tiempo, sin contador de vueltas. El compromiso es con las XX paradas que fijo
 * el manifiesto, y se completan todas (ADR-082, Enmienda 2).
 */
export interface RecorridoDeps {
  readonly cancelado: () => boolean
}

/**
 * Recorre las XX paradas del manifiesto, guardando cada una al terminarla.
 *
 * `cancelado()` se consulta ENTRE paradas, NUNCA dentro: una parada arrancada
 * termina completa y sus hallazgos quedan guardados antes de volver a mirar. El
 * boton solo impide que arranque la SIGUIENTE — es lo que hace que la cobertura
 * al abortar sea una verdad y no la fraccion de algo que quedo a medias.
 */
export async function recorrerParadas(
  context: AppContext,
  scanner: Scanner,
  project: Project,
  manifiesto: Manifiesto,
  progreso: ProgresoDelRecorrido,
  deps: RecorridoDeps
): Promise<Result<ScanSummary>> {
  const paradas = ordenarPorSensibilidad(manifiesto.paradas)
  const at = nowIso()
  const scanId = context.scans.abrir({
    projectId: project.id,
    startedAt: at,
    paradasTotal: paradas.length,
    ficherosTotal: manifiesto.ficherosTotal
  }).id
  const cerrar = crearCierre(context, project, scanId)

  let acumulado = NADA_RECORRIDO

  for (const parada of paradas) {
    if (deps.cancelado()) return ok(cerrar('abortado', acumulado))

    const salida = await escanearParada(scanner, project, parada, progreso)
    // Un fallo del escaner cierra el recorrido ABORTADO con lo que SI se
    // audito, en vez de dejar la fila ABIERTA para siempre. El rastro fino del
    // fallo —su factura, su motivo propio— es la pieza que le falta al arco.
    if (!salida.ok) {
      cerrar('abortado', acumulado)
      return err(salida.error)
    }

    acumulado = sumarParada(acumulado, parada, salida.value)
    await asentarHallazgos(context, project, scanId, salida.value.findings, at)
    progreso.parada({ hecha: acumulado.hechas, total: paradas.length, carpeta: parada.carpeta })
  }

  return ok(cerrar('completo', acumulado))
}
