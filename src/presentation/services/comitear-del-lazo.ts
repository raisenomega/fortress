import { api } from '../adapters/fortress-api'
import { useLazoStore } from '../stores/lazo-store'

/**
 * El COMMIT DURABLE en la vuelta (ATERRIZAJE-4): persiste el trabajo del agente
 * del hallazgo de la CABEZA (el enfocado). Si el turno NO convergio, la red ya
 * revirtio el arbol -> no hay cambios -> el main salta (no commit vacio). Sin
 * cabeza no hay nada enfocado -> no commitea. El main guarda LOCAL (nunca pushea)
 * y respeta el guard self-repo. Un fallo no corta el lazo: el trabajo sigue vivo.
 */
export async function comitearDelLazo(projectId: string): Promise<void> {
  const cabeza = useLazoStore.getState().cola?.[0] ?? null
  if (cabeza === null) return
  try {
    await api().repair.lazoCommit(projectId, cabeza)
  } catch {
    // intencional: el commit es best-effort; el trabajo queda en el arbol
  }
}
