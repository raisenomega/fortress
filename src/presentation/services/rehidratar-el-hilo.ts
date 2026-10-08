import type { ModoDeChat } from '@domain/chat/hilo-de-chat'
import { useConstruirStore } from '../stores/construir-store'
import { elPuerto, type ParDelHilo } from './hilo-activo'

/** El par que la vista tiene delante: libre SIEMPRE sin proyecto. */
export const parDeLaVista = (projectId: string | null, mode: ModoDeChat | 'libre'): ParDelHilo =>
  mode === 'libre' ? { projectId: null, modo: 'libre' } : { projectId, modo: mode }

/**
 * Al abrir o cambiar de par: el hilo MAS RECIENTE del par, o vacio a la
 * espera. GUARDA: con un draft en vuelo no se rehidrata — pero la saltada SE
 * SENALA, jamas se pierde (PASO 110, el cruce del 109). El legado (chat_id
 * NULL) no entra: solo hilos reales de la tabla chats.
 */
export async function rehidratar(par: ParDelHilo): Promise<void> {
  const guarda = useConstruirStore.getState()
  if (guarda.draft !== null) {
    guarda.setRehidratacionPendiente(true)
    return
  }
  const hilos = await elPuerto().listHilos(par.projectId)
  const hilo = hilos.find((h) => h.modo === par.modo) ?? null
  const mensajes = hilo === null ? [] : await elPuerto().listByHilo(hilo.id)
  const store = useConstruirStore.getState()
  store.setHiloActivo(hilo)
  store.replaceMessages(mensajes.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.content }))) // prettier-ignore
  store.setRehidratacionPendiente(false)
}

/**
 * El re-disparo del PASO 110: cuando el draft muere (exito, error o aborto —
 * cualquier via que lo anule), si quedo una rehidratacion debiendo se rehace
 * con el par ACTUAL de la vista (no el que salto: pudiste cambiar otra vez).
 * La senal es booleana A PROPOSITO: no guarda par, y por eso el multi-cambio
 * cae al actual por construccion. Sin senal encendida, no corre nada: el
 * camino feliz no paga recargas.
 */
export async function alMorirElDraft(parActual: ParDelHilo): Promise<void> {
  if (!useConstruirStore.getState().rehidratacionPendiente) return
  await rehidratar(parActual)
}
