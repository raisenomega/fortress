import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import { asentarSeveridadDerivada } from './asentar-severidad'
import { asentarVocabulario } from './asentar-vocabulario'
import type { DatosDelCierre } from './datos-del-cierre'
import { calcularExpediente } from './expediente-del-cierre'
import { escribirFilasDelCierre } from './filas-del-cierre'
import { emitirInforme } from './emitir-informe'
import { escribirMemoria } from './escribir-memoria'
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

  emitirInforme(context, project, datos, calculado)

  escribirMemoria(context, project, datos, calculado)

  return {
    projectId: project.id,
    score: calculado.score,
    scannedAt: datos.at,
    durationMs: datos.durationMs,
    counts: calculado.counts,
    cobertura: {
      estado: datos.motivo === 'completo' ? 'CERRADO' : 'ABORTADO',
      motivoCierre: datos.motivo,
      paradasHechas: datos.paradasHechas,
      paradasTotal: datos.paradasTotal,
      ficherosCubiertos: datos.ficherosCubiertos,
      ficherosTotal: datos.ficherosTotal
    }
  }
}
