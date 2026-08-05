import { api } from '../adapters/fortress-api'
import { loadProjects } from './project-service'
import { useConstruirStore } from '../stores/construir-store'

/** Fase 1: pide el plan (solo lectura). El humano lo aprueba antes de construir. */
export async function preparePlan(projectId: string, intent: string): Promise<void> {
  const store = useConstruirStore.getState()
  store.toPlanning()
  const result = await api().build.plan(projectId, intent)
  if (result.ok) store.toReview(result.value)
  else store.toError(result.error)
}

/** Fase 2: construye el plan aprobado. Refresca proyectos para ver la calidad. */
export async function buildApproved(
  projectId: string,
  intent: string,
  plan: string
): Promise<void> {
  const store = useConstruirStore.getState()
  store.toBuilding()
  const result = await api().build.feature(projectId, intent, plan)
  if (result.ok) store.toDone('Construccion completada. Revisa los cambios en el proyecto.')
  else store.toError(result.error)
  await loadProjects()
}

/** Detener: corta el agente en marcha (plan o build) sin cerrar la app. */
export async function stopBuild(projectId: string): Promise<void> {
  await api().build.stop(projectId)
  useConstruirStore.getState().toError('Detenido por ti.')
}
