import { ipcMain } from 'electron'
import { agentHealth } from '@application/omega/agent-health'
import { auditProject } from '@application/omega/audit-project'
import { readEvidence } from '@application/omega/read-evidence'
import { scoreProject } from '@application/omega/score-project'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/** Cuantos asientos del Libro de la Vida devuelve una lectura del panel. */
const LIST_LIMIT = 200
/** Ejecuciones recientes por proyecto para el perfil de agente. */
const RUNS_LIMIT = 60

export function registerOmegaHandlers(): void {
  // OMEGA audita y deja el asiento en el Libro de la Vida (append-only).
  ipcMain.handle(IPC.omegaAudit, (_event, projectId: string) =>
    auditProject(getAppContext(), projectId)
  )

  // Solo lectura: el operador ve los asientos, nunca puede borrarlos ni editarlos.
  ipcMain.handle(IPC.omegaList, (_event, projectId: string) =>
    getAppContext().omegaLog.listByProject(projectId, LIST_LIMIT)
  )

  ipcMain.handle(IPC.omegaScore, (_event, projectId: string) =>
    scoreProject(getAppContext(), projectId)
  )

  // Vista macro: salud real de cada agente en el proyecto.
  ipcMain.handle(IPC.omegaAgents, (_event, projectId: string) =>
    agentHealth(getAppContext(), projectId)
  )

  // Perfil micro: ejecuciones recientes del proyecto (el renderer filtra por agente).
  ipcMain.handle(IPC.omegaRuns, (_event, projectId: string) =>
    getAppContext().runs.listByProject(projectId, RUNS_LIMIT)
  )

  // Evidencia: codigo real alrededor de la linea citada por un hallazgo.
  ipcMain.handle(IPC.omegaSnippet, (_event, projectId: string, file: string, line: number) =>
    readEvidence(getAppContext(), projectId, file, line)
  )
}
