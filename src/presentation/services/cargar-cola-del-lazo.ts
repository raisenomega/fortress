import { api } from '../adapters/fortress-api'
import { useLazoStore } from '../stores/lazo-store'

/**
 * Carga la cola del lazo (IPC `repair:cola`, reusa `candidates` del Motor) y la
 * CONGELA en el store al arrancar el lazo. Una vez por encendido: el candado
 * estable. Si la lectura falla, cola vacia —nada que hacer— en vez de reventar.
 */
export async function cargarColaDelLazo(projectId: string): Promise<void> {
  try {
    const ids = await api().repair.cola(projectId)
    useLazoStore.getState().congelarCola(ids)
  } catch {
    useLazoStore.getState().congelarCola([])
  }
}
