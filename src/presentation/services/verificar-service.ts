import type { DesenlaceDeVerificacion } from '@domain/repair/dictamen-de-verificacion'
import { api } from '../adapters/fortress-api'
import { useRepairStore } from '../stores/repair-store'
import { reportError, notify } from '../stores/toast-store'

const SIN_OBJETIVO =
  'Ese hallazgo ya no esta mitigado, o el motor ya lo esta trabajando. No hay nada que verificar.'

/** Lo que el operador lee cuando vuelve el dictamen. El caso que importa es el
 *  segundo: su arreglo no cerro el problema, y enterarse es el punto. */
const AVISO: Record<DesenlaceDeVerificacion, string> = {
  extinguido: 'Confirmado: el analista comprobo que el problema ya no esta. Sale del tablero.',
  sin_prueba: 'NO se pudo confirmar: el hallazgo sigue mitigado. Mira su nota.',
  sigue_vivo: 'El analista dice que el problema SIGUE en el codigo. El arreglo no lo cerro.'
}

/**
 * Pide comprobar un hallazgo mitigado (ADR-087).
 *
 * Comparte el `busy` del motor con `proposeRepair` a proposito: detras hay un
 * solo carril —`guardRun` rechaza la segunda corrida sobre el mismo proyecto— y
 * dos banderas distintas dejarian pulsar un boton que el main va a rechazar.
 * Por eso verificar es de una en una, y el boton se apaga mientras tanto.
 */
export async function verificarHallazgo(projectId: string, findingId: string): Promise<void> {
  if (useRepairStore.getState().busy) return

  useRepairStore.getState().setBusy(true)
  try {
    const result = await api().repair.verify(projectId, findingId)
    if (!result.ok) reportError(result.error)
    else if (result.value === null) notify(SIN_OBJETIVO)
    else notify(AVISO[result.value.desenlace])
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al verificar el hallazgo')
  } finally {
    useRepairStore.getState().setBusy(false)
  }
}
