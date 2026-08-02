import { BrowserWindow, ipcMain } from 'electron'
import { addProject } from '@application/project/add-project'
import { listProjects } from '@application/project/list-projects'
import { removeProject } from '@application/project/remove-project'
import type { NewProject } from '@domain/project/project'
import { getAppContext } from '../persistence/app-context'
import { pickProjectFolder } from '../system/folder-picker'
import { IPC } from './channels'

export function registerProjectHandlers(): void {
  ipcMain.handle(IPC.projectsList, () => listProjects(getAppContext()))

  ipcMain.handle(IPC.projectsAdd, (_event, input: NewProject) => addProject(getAppContext(), input))

  ipcMain.handle(IPC.projectsRemove, (_event, id: string) => removeProject(getAppContext(), id))

  // El dialogo se ancla a la ventana que lo pidio para que sea modal.
  ipcMain.handle(IPC.projectsPickFolder, (event) =>
    pickProjectFolder(BrowserWindow.fromWebContents(event.sender))
  )
}
