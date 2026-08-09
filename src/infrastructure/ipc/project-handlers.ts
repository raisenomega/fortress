import { BrowserWindow, ipcMain } from 'electron'
import { addProject } from '@application/project/add-project'
import { listProjects } from '@application/project/list-projects'
import { removeProject } from '@application/project/remove-project'
import { setProjectLoopEnabled } from '@application/project/set-project-loop-enabled'
import { setProjectTrusted } from '@application/project/set-project-trusted'
import { startLoop, stopLoop } from '../loop/loop-controller'
import { exportProjectRecord } from '../project/export-record'
import type { NewProject } from '@domain/project/project'
import { getAppContext } from '../persistence/app-context'
import { pickProjectFolder } from '../system/folder-picker'
import { isFortressRepo } from '../system/self-project'
import { IPC } from './channels'

export function registerProjectHandlers(): void {
  ipcMain.handle(IPC.projectsList, () => listProjects(getAppContext()))

  ipcMain.handle(IPC.projectsAdd, (_event, input: NewProject) => addProject(getAppContext(), input))

  ipcMain.handle(IPC.projectsRemove, (_event, id: string) => {
    const context = getAppContext()
    // Deja el record en la carpeta del proyecto ANTES de borrar sus datos (D7).
    const project = context.projects.findById(id)
    if (project) exportProjectRecord(context, project)
    return removeProject(context, id)
  })

  // trusted desbloquea el allowlist de Bash: se coacciona a booleano estricto
  // para que el renderer no lo active con un valor "truthy" cualquiera.
  // Revocar detiene el loop en curso (stopLoop): quitar la confianza es parar.
  ipcMain.handle(IPC.projectsSetTrusted, (_event, id: string, trusted: boolean) =>
    setProjectTrusted(getAppContext(), String(id), trusted === true, stopLoop)
  )

  ipcMain.handle(IPC.projectsSetLoopEnabled, (_event, id: string, enabled: boolean) => {
    const result = setProjectLoopEnabled(getAppContext(), String(id), enabled === true, isFortressRepo) // prettier-ignore
    // El toggle arranca o para el loop de ese proyecto (aislado por proyecto).
    if (result.ok) (enabled ? startLoop : stopLoop)(id)
    return result
  })

  // El dialogo se ancla a la ventana que lo pidio para que sea modal.
  ipcMain.handle(IPC.projectsPickFolder, (event) =>
    pickProjectFolder(BrowserWindow.fromWebContents(event.sender))
  )
}
