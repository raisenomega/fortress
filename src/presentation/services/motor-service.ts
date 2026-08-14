import { api } from '../adapters/fortress-api'
import { useMotorStore } from '../stores/motor-store'

/**
 * Relee las propuestas del proyecto activo para el indicador de la barra.
 *
 * Si la lectura falla NO se guarda una lista vacia: vacia significa "no hay
 * nada pendiente" y el indicador se pintaria en verde afirmando algo que no se
 * sabe. Al dejar el slot como estaba, su `projectId` no coincide con el activo
 * y el indicador se calla, que es lo honesto cuando no hay dato.
 */
export async function loadMotorProposals(projectId: string): Promise<void> {
  try {
    useMotorStore.getState().setProposals(projectId, await api().repair.list(projectId))
  } catch (error) {
    console.error('[motor-chip] no se pudieron leer las propuestas', projectId, error)
  }
}
