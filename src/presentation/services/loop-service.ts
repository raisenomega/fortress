import { api } from '../adapters/fortress-api'
import { useLoopStore } from '../stores/loop-store'

/**
 * Se suscribe al estado del loop que empuja el main. Se llama una vez al montar
 * la app; devuelve la cancelacion por si hiciera falta.
 */
export function subscribeLoop(): () => void {
  return api().chat.onLoopStatus((status) => useLoopStore.getState().setStatus(status))
}
