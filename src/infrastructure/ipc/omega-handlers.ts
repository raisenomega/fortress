import { ipcMain } from 'electron'
import { auditProject } from '@application/omega/audit-project'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/** Cuantos asientos del Libro de la Vida devuelve una lectura del panel. */
const LIST_LIMIT = 200

export function registerOmegaHandlers(): void {
  // OMEGA audita y deja el asiento en el Libro de la Vida (append-only).
  ipcMain.handle(IPC.omegaAudit, (_event, projectId: string) =>
    auditProject(getAppContext(), projectId)
  )

  // Solo lectura: el operador ve los asientos, nunca puede borrarlos ni editarlos.
  ipcMain.handle(IPC.omegaList, (_event, projectId: string) =>
    getAppContext().omegaLog.listByProject(projectId, LIST_LIMIT)
  )
}
