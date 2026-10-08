import type { TurnoLibre } from '@domain/build/libre-prompt'
import { api } from '../adapters/fortress-api'
import { escucharElPlan } from './escuchar-el-plan'
import { useConstruirStore } from '../stores/construir-store'

/** El id centinela de los trozos del libre: no hay proyecto, pero el canal del
 *  chat pide un id — el mismo que emite el handler de build:libre. */
const LIBRE = 'chat-libre'

/** Modo LIBRE (PASO 91): conversa sin repo, powers-off. El hilo viaja entero
 *  porque cada corrida del CLI es una sesion nueva. */
export async function sendLibre(intent: string): Promise<void> {
  const store = useConstruirStore.getState()
  const hilo = store.messages as readonly TurnoLibre[]
  store.push({ role: 'user', text: `Libre: ${intent}` })
  store.setBusy(true)
  const corte = escucharElPlan(LIBRE)
  try {
    const result = await api().build.libre(intent, hilo)
    store.finishDraft(result.ok ? result.value : `No se pudo: ${result.error}`)
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Se interrumpio'
    store.finishDraft(`No se pudo: ${detail}`)
  } finally {
    corte()
    store.setBusy(false)
  }
}

/** «Convertir a Plan»: la charla libre se vuelve tarea — patron del Transferir
 *  (precargar + cambiar modo). Sin conversacion no hay nada que convertir. */
export function convertirAPlan(): void {
  const store = useConstruirStore.getState()
  if (store.messages.length === 0) return
  const charla = store.messages.map((m) => `${m.role === 'user' ? 'Operador' : 'Agente'}: ${m.text}`).join('\n\n') // prettier-ignore
  store.setMode('plan')
  store.setInput(`Convierte esta conversacion en un plan concreto:\n\n${charla}`)
}
