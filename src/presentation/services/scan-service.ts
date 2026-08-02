import { api } from '../adapters/fortress-api'
import { loadProjects } from './project-service'
import { useScanStore } from '../stores/scan-store'

/** Conteos de todos los proyectos: los pide el tablero al arrancar. */
export async function loadCounts(): Promise<void> {
  useScanStore.getState().setCounts(await api().scan.counts())
}

export async function loadFindings(projectId: string): Promise<void> {
  useScanStore.getState().setFindings(projectId, await api().scan.findings(projectId))
}

/**
 * Lanza el escaneo y va pintando lo que el agente hace mientras dura. Al
 * terminar recarga hallazgos, conteos y proyectos: el score vive en la fila
 * del proyecto, asi que la lista tambien queda desactualizada tras un scan.
 */
export async function runScan(projectId: string): Promise<void> {
  const store = useScanStore.getState()
  if (store.runningProjectId) return

  store.startScan(projectId)
  const unsubscribe = api().scan.onProgress((chunk) => {
    if (chunk.projectId === projectId) useScanStore.getState().appendProgress(chunk.delta)
  })

  try {
    const result = await api().scan.run(projectId)
    useScanStore
      .getState()
      .finishScan(projectId, result.ok ? result.value : null, result.ok ? null : result.error)
  } catch (error) {
    // Sin esto un fallo del canal IPC dejaria el escaneo "en curso" para
    // siempre y el boton no se volveria a poder pulsar.
    const detail = error instanceof Error ? error.message : 'El escaneo se interrumpio'
    useScanStore.getState().finishScan(projectId, null, detail)
  } finally {
    unsubscribe()
    await Promise.all([loadFindings(projectId), loadCounts(), loadProjects()])
  }
}
