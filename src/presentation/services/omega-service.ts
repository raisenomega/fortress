import type { FileSnippet } from '@domain/omega/filesystem-probe'
import { api } from '../adapters/fortress-api'
import { useOmegaStore } from '../stores/omega-store'

/** Lee todo lo que pinta el superdashboard: log, puntuacion, salud y ejecuciones. */
export async function loadOmega(projectId: string): Promise<void> {
  const [log, score, agents, runs] = await Promise.all([
    api().omega.list(projectId),
    api().omega.score(projectId),
    api().omega.agents(projectId),
    api().omega.runs(projectId)
  ])
  useOmegaStore
    .getState()
    .setData(projectId, { log, score: score.ok ? score.value : null, agents, runs })
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

/** Codigo real alrededor de una linea; null si no se pudo leer. */
export async function fetchSnippet(
  projectId: string,
  file: string,
  line: number
): Promise<FileSnippet | null> {
  const result = await api().omega.snippet(projectId, file, line)
  return result.ok ? result.value : null
}
