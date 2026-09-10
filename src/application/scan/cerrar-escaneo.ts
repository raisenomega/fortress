import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import { asentarSeveridadDerivada } from './asentar-severidad'
import { asentarVocabulario } from './asentar-vocabulario'
import type { DatosDelCierre } from './datos-del-cierre'
import { calcularExpediente } from './expediente-del-cierre'
import { escribirFilasDelCierre } from './filas-del-cierre'
import type { ScanSummary } from './scan-types'

/**
 * Cierra el escaneo: fija su nota, su estado y su cobertura, y deja el rastro
 * del recorrido. Corre UNA sola vez, tarde una parada o doce (ADR-082).
 *
 * NO cierra ningun hallazgo. Un escaneo solo puede afirmar lo que vio; lo que
 * no nombro sigue vivo y puntuando, porque el escaner es un LLM leyendo codigo
 * y su silencio no es un veredicto. Quien cierra un hallazgo es un agente que
 * lo mira, al drenar.
 */
export function cerrarEscaneo(
  context: AppContext,
  project: Project,
  datos: DatosDelCierre
): ScanSummary {
  const calculado = calcularExpediente(context, project, datos)

  escribirFilasDelCierre(context, project, datos, calculado)

  // Los dos termometros de la corrida, fuera de la transaccion y a mejor
  // esfuerzo: lo que la derivacion cambio respecto al modelo (ADR-080) y
  // cuanto no se supo clasificar (ADR-081).
  asentarSeveridadDerivada(context, project, datos.reportados)
  asentarVocabulario(context, project, datos.reportados)

  // Cognition registra lo aprendido en la memoria del proyecto. Fuera de la
  // transaccion: es un archivo, y perderlo no debe invalidar el escaneo.
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

  return {
    projectId: project.id,
    score: calculado.score,
    scannedAt: datos.at,
    durationMs: datos.durationMs,
    counts: calculado.counts
  }
}
