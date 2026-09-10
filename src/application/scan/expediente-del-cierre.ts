import { findingIdentity } from '@domain/project/finding-identity'
import type { Project } from '@domain/project/project'
import { countFindings } from '@domain/project/severity-counts'
import { ausentes } from '@domain/scan/ausencia'
import { scoreFromFindings } from '@domain/scan/score-from-findings'
import type { AppContext } from '../context'
import type { Calculado, DatosDelCierre } from './datos-del-cierre'
import { asDetected } from './expediente-vivo'

/**
 * El expediente y su nota, calculados UNA vez y con el recorrido terminado.
 *
 * `ausentes` es lo unico de todo el reparto que exige el conjunto COMPLETO:
 * preguntarlo a mitad del recorrido daria por no nombrado lo que una parada
 * posterior todavia no ha mirado. Por eso el calculo vive en el cierre y no en
 * `asentarHallazgos`, que si puede correr N veces.
 *
 * El score puntua el EXPEDIENTE, no la corrida: lo reportado MAS los ACTIVE que
 * este escaneo no nombro y nadie arreglo. Puntuar solo la corrida mentia por
 * omision — 92 en el tablero con un HIGH vivo en la base (78 real).
 */
export function calcularExpediente(
  context: AppContext,
  project: Project,
  datos: DatosDelCierre
): Calculado {
  const memoria = context.findings.listMemory(project.id)
  const reportadas = new Set(datos.reportados.map(findingIdentity))
  const expediente = [...datos.reportados, ...asDetected(ausentes(memoria, reportadas))]

  return { score: scoreFromFindings(expediente), counts: countFindings(expediente), expediente }
}
