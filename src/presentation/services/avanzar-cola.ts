import { api } from '../adapters/fortress-api'
import { useLazoStore } from '../stores/lazo-store'

/**
 * ATERRIZAJE-5: avanza la cabeza de la cola SOLO si el hallazgo trabajado se
 * EXTINGUIO de verdad —el main comprueba `lifecycle === 'EXTINCT'`, nunca por
 * ausencia (ADR-065)—. Si sigue vivo NO avanza: se re-intenta, acotado por el
 * empujon/estancamiento y maxVueltas. Un fallo del IPC NO avanza (conservador:
 * no perder de vista el hallazgo por una lectura que fallo).
 */
export async function avanzarCola(projectId: string, findingId: string): Promise<void> {
  try {
    if (await api().repair.lazoExtinto(projectId, findingId)) useLazoStore.getState().popCola()
  } catch {
    // sin señal fiable no se avanza: el hallazgo sigue en la cabeza
  }
}
