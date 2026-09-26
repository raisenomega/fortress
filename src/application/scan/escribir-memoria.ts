import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import type { Calculado, DatosDelCierre } from './datos-del-cierre'

/**
 * Cognition registra lo aprendido en la memoria del proyecto. Fuera de la
 * transaccion: es un archivo, y perderlo no debe invalidar el escaneo.
 *
 * SOLO SI VIO ALGO. Con cero paradas terminadas no hay nada que afirmar, y
 * escribir «sin hallazgos, score 100» era mentir: 31 de 59 sesiones del log
 * del repo propio eran eso, una por gate (la suite lo registra con su ruta
 * real y el escaneo nace parado). Una parada hecha, aunque luego se detenga,
 * si cuenta: esa memoria es buena y se conserva.
 */
export function escribirMemoria(
  context: AppContext,
  project: Project,
  datos: DatosDelCierre,
  calculado: Calculado
): void {
  if (datos.paradasHechas === 0) return
  context.cognitionWriter.writeScan({
    projectPath: project.path,
    projectName: project.name,
    // El expediente entero: un ausente que nadie ha arreglado sigue listado. Si
    // solo se escribiera lo reportado, dejaria de mentir llamandolo extinto
    // para mentir callandolo.
    findings: calculado.expediente,
    // Un escaneo ya no resuelve nada por su cuenta: cerrar exige juicio.
    resolved: [],
    score: calculado.score,
    counts: calculado.counts,
    at: datos.at
  })
}
