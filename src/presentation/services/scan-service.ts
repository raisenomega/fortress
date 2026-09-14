import { api } from '../adapters/fortress-api'
import { reloadAfterScan } from './recarga-tras-escaneo'
import { useScanStore } from '../stores/scan-store'
import { useTableroStore } from '../stores/tablero-store'

/** Conteos de todos los proyectos: los pide el tablero al arrancar. */
export async function loadCounts(): Promise<void> {
  useScanStore.getState().setCounts(await api().scan.counts())
}

/**
 * Relee la tabla y PODA la seleccion con lo que vuelve.
 *
 * Un extinguido desaparece de la lista y su id se quedaria en el `Set` para
 * siempre: la barra diria «9 seleccionados» con seis filas delante, y verificar
 * gastaria corridas en fantasmas. La poda va pegada a la recarga —y no en un
 * efecto de la vista— porque el hecho es el mismo: la tabla cambio.
 */
export async function loadFindings(projectId: string): Promise<void> {
  const findings = await api().scan.findings(projectId)
  useScanStore.getState().setFindings(projectId, findings)
  useTableroStore.getState().podar(
    projectId,
    findings.map((f) => f.id)
  )
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
    if (chunk.projectId !== projectId) return
    useScanStore.getState().appendProgress(chunk.delta)
    if (chunk.parada) useScanStore.getState().setParada(chunk.parada)
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
    await reloadAfterScan(projectId)
  }
}
