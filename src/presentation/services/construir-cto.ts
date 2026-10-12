import type { TurnoLibre } from '@domain/build/libre-prompt'
import { api } from '../adapters/fortress-api'
import { escucharElPlan } from './escuchar-el-plan'
import { finishDraftPersistido, pushUserPersistido } from './hilo-activo'
import { useConstruirStore } from '../stores/construir-store'
import { useCtoFaseStore } from '../stores/cto-fase-store'
import { useSaltoStore } from '../stores/salto-store'
import { autoSaltoDelCto } from './auto-salto-del-cto'

/** El id centinela de los trozos del CTO: sin proyecto, su propio carril —
 *  el mismo que emite el handler de build:cto. */
const CTO = 'chat-cto'

/** Modo CTO (PASO 126): espejo de sendLibre — conversa y planifica sin repo,
 *  powers-off (el candado del libre, reutilizado). El hilo viaja entero
 *  porque cada corrida del CLI es una sesion nueva; persiste con modo 'cto'
 *  (la puerta que abrio la Fase 1) y reabre COMO CTO. El ancla (Sello B.1) es
 *  ESTADO DE UI: viaja al turno y NO se persiste — el hilo sigue global. */
export async function sendCto(intent: string, ancla: string | null): Promise<void> {
  const store = useConstruirStore.getState()
  const hilo = store.messages as readonly TurnoLibre[]
  useSaltoStore.getState().cancelar() // un turno nuevo anula un salto en vuelo
  pushUserPersistido({ projectId: null, modo: 'cto' }, `CTO: ${intent}`)
  store.setBusy(true)
  useCtoFaseStore.getState().reiniciarFases() // chips a gris cada turno (PASO 158)
  const corte = escucharElPlan(CTO)
  try {
    const result = await api().build.cto(intent, hilo, ancla)
    if (result.ok) {
      finishDraftPersistido(result.value)
      autoSaltoDelCto(result.value) // Sello 2b-a: en autonomo, el PASO salta solo
    } else finishDraftPersistido(`No se pudo: ${result.error}`)
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Se interrumpio'
    finishDraftPersistido(`No se pudo: ${detail}`)
  } finally {
    corte()
    store.setBusy(false)
  }
}
