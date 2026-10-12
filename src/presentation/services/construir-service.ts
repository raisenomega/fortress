import { CTO_OWNER } from '@domain/build/cto-owner'
import { api } from '../adapters/fortress-api'
import { useConstruirStore } from '../stores/construir-store'
import { useLazoStore } from '../stores/lazo-store'
import { useSaltoStore } from '../stores/salto-store'
import { sendCto } from './construir-cto'
import { sendInvestigate, sendPlan } from './construir-envios'
import { sendExecute } from './construir-execute'
import { sendLibre } from './construir-libre'

/** El despacho del Chat (PASO 126: los envios con proyecto viven en
 *  construir-envios, split por el techo de lineas). Un modo, un emisor. */

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
  // El ancla del CTO (Sello B.1): el proyecto activo de la vista, o nada ('').
  else if (store.mode === 'cto') void sendCto(intent, projectId === '' ? null : projectId)
  else void sendInvestigate(projectId, intent)
}

/** Adjunta un archivo para que el agente lo lea (selector nativo). */
export async function attachFile(): Promise<void> {
  const path = await api().build.pickFile()
  if (path) useConstruirStore.getState().setAttached(path)
}

/** Detener: corta el agente en marcha sin cerrar la app. En modo CTO el agente
 *  corre bajo el owner CTO_OWNER (su cuarto), no bajo el projectId anclado;
 *  parar debe apuntar a ESE owner o no mata nada (Sello 1, PASO 149). Los demas
 *  modos (plan/investigacion/ejecutor) siguen por projectId. */
export async function stopBuild(projectId: string): Promise<void> {
  const store = useConstruirStore.getState()
  useSaltoStore.getState().cancelar() // Detener corta tambien un salto en ventana
  useLazoStore.getState().parar() // ...y apaga el lazo autonomo (Sello 2b)
  const owner = store.mode === 'cto' ? CTO_OWNER : projectId
  await api().build.stop(owner)
  store.setBusy(false)
  store.push({ role: 'assistant', text: 'Detenido por ti.' })
}
