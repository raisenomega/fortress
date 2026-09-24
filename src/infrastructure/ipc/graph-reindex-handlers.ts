import { ipcMain } from 'electron'
import { focoDeVentana, reconcileProject } from '../graph/reconcile-service'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

export function registerGraphReindexHandlers(): void {
  // Disparo manual desde el chip. Devuelve la DECISION; jamas espera el indexado.
  ipcMain.handle(IPC.graphReindex, (_event, projectId: string) =>
    reconcileProject(String(projectId))
  )

  // Estado persistido + HEAD vivo, para que el chip compare sin logica propia.
  ipcMain.handle(IPC.graphState, (_event, projectId: string) => {
    const context = getAppContext()
    const project = context.projects.findById(String(projectId))
    if (!project) return null
    return {
      ...context.graphState.getGraphState(project.id),
      currentSha: context.headSha(project.path)
    }
  })

  // Foco de proyecto en el renderer: reconciliar en background, sin bloquear.
  // Queda recordado: al volver a la ventana se vuelve a mirar ese mismo proyecto.
  ipcMain.handle(IPC.projectsFocus, (_event, projectId: string) => {
    focoDeVentana.enfocar(String(projectId))
    return null
  })
}
