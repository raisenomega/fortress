import type { Result } from '@domain/shared/result'
import { api } from '../adapters/fortress-api'
import { type ConstruirMode, useConstruirStore } from '../stores/construir-store'
import { sendExecute } from './construir-execute'

/** Empuja el turno del usuario, corre la llamada y empuja la respuesta. */
async function ask(
  label: string,
  intent: string,
  call: Promise<Result<string>>
): Promise<Result<string>> {
  const store = useConstruirStore.getState()
  store.push({ role: 'user', text: `${label}: ${intent}` })
  store.setBusy(true)
  const result = await call
  store.setBusy(false)
  store.push({ role: 'assistant', text: result.ok ? result.value : `No se pudo: ${result.error}` })
  return result
}

/** Modo Plan: el planner devuelve un plan (solo lectura). Se guarda como pendiente. */
export async function sendPlan(projectId: string, intent: string): Promise<void> {
  const result = await ask('Plan', intent, api().build.plan(projectId, intent))
  if (result.ok) useConstruirStore.getState().setPendingPlan({ intent, plan: result.value })
}

/** Modo Investigacion: el agente responde en solo lectura, sin plan ni edicion. */
export async function sendInvestigate(projectId: string, intent: string): Promise<void> {
  await ask('Investigacion', intent, api().build.investigate(projectId, intent))
}

/** Compone la intencion (texto + adjunto), limpia el input y despacha por modo. */
export function submitConstruir(projectId: string, mode: ConstruirMode): void {
  if (mode === 'ejecutor') {
    void sendExecute(projectId)
    return
  }
  const store = useConstruirStore.getState()
  const raw = store.input.trim()
  if (!raw) return
  const intent = store.attached ? `${raw}\n\nArchivo a leer: ${store.attached}` : raw
  store.setInput('')
  store.setAttached(null)
  if (mode === 'plan') void sendPlan(projectId, intent)
  else void sendInvestigate(projectId, intent)
}

/** Adjunta un archivo para que el agente lo lea (selector nativo). */
export async function attachFile(): Promise<void> {
  const path = await api().build.pickFile()
  if (path) useConstruirStore.getState().setAttached(path)
}

/** Detener: corta el agente en marcha sin cerrar la app. */
export async function stopBuild(projectId: string): Promise<void> {
  await api().build.stop(projectId)
  const store = useConstruirStore.getState()
  store.setBusy(false)
  store.push({ role: 'assistant', text: 'Detenido por ti.' })
}
