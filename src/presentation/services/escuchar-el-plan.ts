import { api } from '../adapters/fortress-api'
import { useConstruirStore } from '../stores/construir-store'

/**
 * Lo que un turno de Plan/Investigacion escucha mientras corre: los trozos
 * llegan por el MISMO canal del chat (tachados en origen por chunkSender, y
 * sin cruce posible: un solo carril por proyecto) y se acumulan como borrador.
 * Gemelo de `escuchar-el-turno`; devuelve el corte de la suscripcion, que el
 * `finally` del envio tiene que llamar siempre.
 */
export function escucharElPlan(projectId: string): () => void {
  return api().chat.onChunk((chunk) => {
    if (chunk.projectId === projectId) useConstruirStore.getState().appendDraft(chunk.delta)
  })
}
