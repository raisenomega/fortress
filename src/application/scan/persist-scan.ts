import type { Project } from '@domain/project/project'
import type { ScanOutcome } from '@domain/scan/scanner'
import { nowIso } from '@domain/shared/id'
import type { AppContext } from '../context'
import { cerrarEscaneo } from './cerrar-escaneo'
import { asentarHallazgos } from './asentar-hallazgos'
import type { ScanSummary } from './scan-types'

/**
 * Guarda todo lo que produjo un escaneo, por el camino PARTIDO de ADR-082:
 * abrir la fila, guardar lo encontrado, cerrar con la nota final.
 *
 * Hoy son tres pasos seguidos para una sola parada, asi que el resultado es
 * exactamente el mismo que producia la transaccion soldada: una fila CERRADA
 * con su score, sus hallazgos y una entrada de timeline. Eso es deliberado —
 * primero se prueba que partir no cambia nada, y despues se meten las paradas.
 *
 * Quien orqueste N paradas llamara a `asentarHallazgos` una vez por parada y a
 * `cerrarEscaneo` al final; ninguna de las dos piezas necesita saber cuantas
 * hubo.
 */
export async function persistScan(
  context: AppContext,
  project: Project,
  outcome: ScanOutcome
): Promise<ScanSummary> {
  const { findings, durationMs, usage, tools, edits } = outcome
  const at = nowIso()

  // Una parada, y todavia sin manifiesto: los ficheros no se han contado, y
  // null lo dice sin fingir un cero que afirmaria que no hay ninguno.
  const abierto = context.scans.abrir({
    projectId: project.id,
    startedAt: at,
    paradasTotal: 1,
    ficherosTotal: null
  })

  await asentarHallazgos(context, project, abierto.id, findings, at)

  return cerrarEscaneo(context, project, {
    scanId: abierto.id,
    reportados: findings,
    paradasHechas: 1,
    ficherosCubiertos: null,
    motivo: 'completo',
    at,
    durationMs,
    usage,
    tools,
    edits
  })
}
