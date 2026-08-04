import { ipcMain } from 'electron'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/** Backlog de auto-mejora de FORTRESS: lo que los agentes descubren de FORTRESS
 *  mismo mientras trabajan en otros proyectos. */
export function registerSystemHandlers(): void {
  ipcMain.handle(IPC.systemObservations, () => getAppContext().selfObservations.listOpen())

  ipcMain.handle(IPC.systemResolveObservation, (_event, id: string) =>
    getAppContext().selfObservations.resolve(id)
  )
}
