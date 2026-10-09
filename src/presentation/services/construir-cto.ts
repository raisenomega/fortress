import type { TurnoLibre } from '@domain/build/libre-prompt'
import { api } from '../adapters/fortress-api'
import { escucharElPlan } from './escuchar-el-plan'
import { finishDraftPersistido, pushUserPersistido } from './hilo-activo'
import { useConstruirStore } from '../stores/construir-store'

/** El id centinela de los trozos del CTO: sin proyecto, su propio carril —
 *  el mismo que emite el handler de build:cto. */
const CTO = 'chat-cto'

/** Modo CTO (PASO 126): espejo de sendLibre — conversa y planifica sin repo,
 *  powers-off (el candado del libre, reutilizado). El hilo viaja entero
 *  porque cada corrida del CLI es una sesion nueva; persiste con modo 'cto'
 *  (la puerta que abrio la Fase 1) y reabre COMO CTO. */
export async function sendCto(intent: string): Promise<void> {
  const store = useConstruirStore.getState()
  const hilo = store.messages as readonly TurnoLibre[]
  pushUserPersistido({ projectId: null, modo: 'cto' }, `CTO: ${intent}`)
  store.setBusy(true)
  const corte = escucharElPlan(CTO)
  try {
    const result = await api().build.cto(intent, hilo)
    finishDraftPersistido(result.ok ? result.value : `No se pudo: ${result.error}`)
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Se interrumpio'
    finishDraftPersistido(`No se pudo: ${detail}`)
  } finally {
    corte()
    store.setBusy(false)
  }
}
