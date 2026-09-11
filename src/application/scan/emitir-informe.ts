import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import type { Calculado, DatosDelCierre } from './datos-del-cierre'
import { datosDelInforme } from './datos-del-informe'

/**
 * El entregable de la auditoria, con lo que se decidio EN ESTE escaneo. Se
 * compone al cerrar y no despues porque es aqui donde estan los datos: el
 * manifiesto muere al terminar el recorrido, y la base guarda el resumen de la
 * corrida, no la corrida.
 *
 * Con su guarda, ademas de la del escritor, y por la misma razon que
 * `asentarVocabulario`: a estas alturas el escaneo ya esta en la base con sus
 * hallazgos y su fila. Ningun documento vale una auditoria, asi que ni un
 * puerto roto puede llevarsela por delante.
 */
export function emitirInforme(
  context: AppContext,
  project: Project,
  datos: DatosDelCierre,
  calculado: Calculado
): void {
  try {
    context.informeWriter.write(datosDelInforme(context, project, datos, calculado))
  } catch (error) {
    console.error('[scan] no se pudo emitir el informe', datos.scanId, error)
  }
}
