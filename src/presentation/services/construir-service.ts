import { err, type Result } from '@domain/shared/result'
import { api } from '../adapters/fortress-api'
import { useConstruirStore } from '../stores/construir-store'
import { sendExecute } from './construir-execute'
import { sendLibre } from './construir-libre'
import { escucharElPlan } from './escuchar-el-plan'

/** Empuja el turno, escucha el borrador en vivo y cierra con finishDraft. */
async function ask(
  projectId: string,
  label: string,
  intent: string,
  call: Promise<Result<string>>
): Promise<Result<string>> {
  const store = useConstruirStore.getState()
  store.push({ role: 'user', text: `${label}: ${intent}` })
  store.setBusy(true)
  const corte = escucharElPlan(projectId)
  try {
    const result = await call
    store.finishDraft(result.ok ? result.value : `No se pudo: ${result.error}`)
    return result
  } catch (error) {
    // Sin catch, un fallo del canal dejaria busy:true y el input bloqueado.
    const detail = error instanceof Error ? error.message : 'Se interrumpio'
    store.finishDraft(`No se pudo: ${detail}`)
    return err(detail)
  } finally {
    corte()
    store.setBusy(false)
  }
}

/** Modo Plan: el planner devuelve un plan (solo lectura). Se guarda como pendiente. */
export async function sendPlan(projectId: string, intent: string): Promise<void> {
  const result = await ask(projectId, 'Plan', intent, api().build.plan(projectId, intent))
  if (result.ok) useConstruirStore.getState().setPendingPlan({ intent, plan: result.value })
}

/** Modo Investigacion: el agente responde en solo lectura, sin plan ni edicion. */
export async function sendInvestigate(projectId: string, intent: string): Promise<void> {
  await ask(projectId, 'Investigacion', intent, api().build.investigate(projectId, intent))
}

/** Envia con el MODO ACTIVO: compone intencion, limpia input y despacha. */
export function submitConstruir(projectId: string): void {
  const store = useConstruirStore.getState()
  if (store.busy) return
  if (store.mode === 'ejecutor') {
    void sendExecute(projectId)
    return
  }
  const raw = store.input.trim()
  if (!raw) return
  const intent = store.attached ? `${raw}\n\nArchivo a leer: ${store.attached}` : raw
  store.setInput('')
  store.setAttached(null)
  if (store.mode === 'plan') void sendPlan(projectId, intent)
  else if (store.mode === 'libre') void sendLibre(intent)
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
