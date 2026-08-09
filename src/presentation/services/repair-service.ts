import { api } from '../adapters/fortress-api'
import { reportError } from '../stores/toast-store'
import { useRepairStore } from '../stores/repair-store'

/**
 * Localiza el proyecto que ES el propio repo: el debut del motor es self. Lo
 * resuelve el main (repair:self): projects.self() es null en la app
 * empaquetada y aqui el codigo corre justamente empaquetado.
 */
export async function locateSelfProject(): Promise<void> {
  try {
    const own = await api().repair.self()
    useRepairStore.getState().setProject(own?.id ?? null)
    if (own) await loadRepair(own.id)
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'No se pudo localizar el repo propio')
  }
}

/** Relee el expediente de propuestas y los hallazgos (para pintar cada fila). */
export async function loadRepair(projectId: string): Promise<void> {
  const [proposals, findings] = await Promise.all([
    api().repair.list(projectId),
    api().scan.findings(projectId)
  ])
  useRepairStore.getState().setData(proposals, findings)
}

/** C1 elige + C2 analiza (agente real, solo lectura; puede tardar minutos). */
export async function proposeRepair(): Promise<void> {
  const { projectId, busy } = useRepairStore.getState()
  if (projectId === null || busy) return

  useRepairStore.getState().setBusy(true)
  try {
    const result = await api().repair.propose(projectId)
    if (!result.ok) reportError(result.error)
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al proponer la reparacion')
  } finally {
    useRepairStore.getState().setBusy(false)
    await loadRepair(projectId)
  }
}
