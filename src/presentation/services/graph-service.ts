import { api } from '../adapters/fortress-api'
import { useGraphActionStore } from '../stores/graph-action-store'
import { useGraphStore } from '../stores/graph-store'

export async function loadGraph(projectId: string): Promise<void> {
  useGraphStore.getState().setStatus(projectId, await api().graph.status(projectId))
}

/** Instala/conecta el grafo del proyecto, con progreso en vivo, y refresca el estado. */
export async function installGraph(projectId: string): Promise<void> {
  useGraphActionStore.getState().start('install')
  const unsubscribe = api().graph.onProgress((chunk) => {
    if (chunk.projectId === projectId) useGraphActionStore.getState().append(chunk.delta)
  })
  try {
    const result = await api().graph.install(projectId)
    if (result.ok) useGraphStore.getState().setStatus(projectId, result.value)
    useGraphActionStore.getState().done(result.ok ? {} : { error: result.error })
  } finally {
    unsubscribe()
    await loadGraph(projectId)
  }
}

/** Verifica en una sesion real que el grafo conecta y expone sus tools. */
export async function verifyGraph(projectId: string): Promise<void> {
  useGraphActionStore.getState().start('verify')
  useGraphActionStore.getState().done({ verify: await api().graph.verify(projectId) })
}

/** A/B: la misma pregunta en 'lectura' (solo grafo) y 'normal'; muestra tokens. */
export async function runAbGraph(projectId: string, question: string): Promise<void> {
  useGraphActionStore.getState().start('ab')
  const result = await api().graph.ab(projectId, question)
  useGraphActionStore.getState().done(result.ok ? { ab: result.value } : { error: result.error })
}
