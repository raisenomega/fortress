import { api } from '../adapters/fortress-api'
import { loadProjects } from './project-service'
import { useConstruirStore } from '../stores/construir-store'

/**
 * Modo Ejecutor: construye el PLAN PENDIENTE con red git+verify (revierte en rojo).
 * Elegir Ejecutor ES tu aprobacion del plan; exige haber pedido un Plan antes.
 */
export async function sendExecute(projectId: string): Promise<void> {
  const store = useConstruirStore.getState()
  const pending = store.pendingPlan
  if (!pending) {
    store.push({
      role: 'assistant',
      text: 'Primero pide un Plan (modo Plan) y revisalo; luego Ejecutor lo construye.'
    })
    return
  }
  store.push({ role: 'user', text: 'Ejecutor: construir el plan revisado' })
  store.setBusy(true)
  try {
    const result = await api().build.feature(projectId, pending.intent, pending.plan)
    store.push({
      role: 'assistant',
      text: result.ok
        ? 'Construccion completada. Revisa los cambios en el proyecto.'
        : `No se aplico: ${result.error}`
    })
    if (result.ok) store.setPendingPlan(null)
  } catch (error) {
    // Sin catch, un fallo del canal dejaria busy:true y el input bloqueado.
    const detail = error instanceof Error ? error.message : 'Se interrumpio'
    store.push({ role: 'assistant', text: `No se aplico: ${detail}` })
  } finally {
    store.setBusy(false)
    await loadProjects()
  }
}
