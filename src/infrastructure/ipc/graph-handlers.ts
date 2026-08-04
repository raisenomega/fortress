import { ipcMain } from 'electron'
import { NOT_INSTALLED } from '@domain/graph/graph-status'
import { detectGraph } from '../graph/detect-graph'
import { readGraphIndex } from '../graph/read-graph-index'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

export function registerGraphHandlers(): void {
  ipcMain.handle(IPC.graphStatus, (_event, projectId: string) => {
    const project = getAppContext().projects.findById(projectId)
    if (!project) return NOT_INSTALLED

    const status = detectGraph(project.path)
    // Configurado: se adjuntan las estadisticas reales del indice (o null si
    // aun no se ha indexado). Antes el panel decia "no lo leo"; ahora lo lee.
    return status.state === 'configurado'
      ? { ...status, stats: readGraphIndex(project.path) }
      : status
  })
}
