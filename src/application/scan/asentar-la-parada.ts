import type { Project } from '@domain/project/project'
import type { Parada } from '@domain/scan/parada'
import type { ScanOutcome } from '@domain/scan/scanner'
import { nowIso } from '@domain/shared/id'
import type { AppContext } from '../context'
import { asentarCorridaDeParada } from './asentar-corrida-de-parada'
import { asentarHallazgos } from './asentar-hallazgos'

/** Lo que la parada deja al terminar, y donde se apunta. */
export interface CierreDeParada {
  readonly scanId: string
  readonly indice: number
  /** El instante del ESCANEO, compartido por sus hallazgos (ADR-065). */
  readonly at: string
}

/**
 * Todo lo que se guarda cuando una parada termina, en un solo sitio.
 *
 * Son dos asientos con destinos distintos —sus hallazgos y su factura— y se
 * hacen juntos porque comparten el momento: es el unico instante en el que la
 * salida de ESA parada existe entera, antes de que el acumulado la funda con
 * las demas. Despues ya no hay de donde sacarla.
 *
 * La corrida va primero y sin `await` porque no puede fallar hacia fuera: su
 * error se traga dentro. Los hallazgos van despues, que son lo que el operador
 * vino a buscar.
 */
export async function asentarLaParada(
  context: AppContext,
  project: Project,
  parada: Parada,
  cierre: CierreDeParada,
  salida: ScanOutcome
): Promise<void> {
  asentarCorridaDeParada(
    context,
    project,
    parada,
    { scanId: cierre.scanId, indice: cierre.indice, at: nowIso() },
    salida
  )
  await asentarHallazgos(context, project, cierre.scanId, salida.findings, cierre.at)
}
