import type { Project } from '@domain/project/project'
import type { DatosDelInforme } from '@domain/scan/informe-datos'
import type { AppContext } from '../context'
import type { Calculado, DatosDelCierre } from './datos-del-cierre'

/** La version que firma el informe. Sin ella, «lo audito FORTRESS» no dice cual. */
export const VERSION_FORTRESS = '1.0.0'

/**
 * Reune lo que el informe transcribe. Lo unico que pregunta fuera es el HEAD
 * —el ancla de la cadena de custodia— y lo pregunta AHORA, al cerrar: dentro de
 * un mes el repo estara en otro commit y el informe citaria el equivocado.
 *
 * Las huellas por fichero van vacias mientras haya HEAD: el commit ya identifica
 * el arbol entero de forma criptografica, y hashear ademas dos mil ficheros
 * seria pagar un recorrido del disco para repetir lo que el sha ya dice.
 */
export function datosDelInforme(
  context: AppContext,
  project: Project,
  datos: DatosDelCierre,
  calculado: Calculado
): DatosDelInforme {
  return {
    projectName: project.name,
    scanId: datos.scanId,
    at: datos.at,
    headSha: context.headSha(project.path),
    version: VERSION_FORTRESS,
    estado: datos.motivo === 'completo' ? 'CERRADO' : 'ABORTADO',
    motivo: datos.motivo,
    score: calculado.score,
    expediente: calculado.expediente.length,
    reportados: datos.reportados,
    paradasHechas: datos.paradasHechas,
    paradasTotal: datos.paradasTotal,
    ficherosCubiertos: datos.ficherosCubiertos,
    ficherosTotal: datos.ficherosTotal,
    modulos: datos.modulos,
    huellas: []
  }
}
