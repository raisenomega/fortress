import { api } from '../adapters/fortress-api'
import { useOmegaStore } from '../stores/omega-store'

/** Lee el Libro de la Vida y la puntuacion actual del proyecto. */
export async function loadOmega(projectId: string): Promise<void> {
  const [log, score] = await Promise.all([
    api().omega.list(projectId),
    api().omega.score(projectId)
  ])
  useOmegaStore.getState().setData(projectId, { log, score: score.ok ? score.value : null })
}

/** OMEGA audita: verifica los hallazgos contra el disco y refresca el panel. */
export async function runAudit(projectId: string): Promise<void> {
  const store = useOmegaStore.getState()
  if (store.auditing) return
  store.setAuditing(projectId)
  try {
    await api().omega.audit(projectId)
    await loadOmega(projectId)
  } finally {
    useOmegaStore.getState().setAuditing(null)
  }
}
