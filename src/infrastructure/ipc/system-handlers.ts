import { ipcMain } from 'electron'
import { describeCapabilities } from '@application/system/describe-capabilities'
import { promoteCapability } from '@application/system/promote-capability'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/** Backlog de auto-mejora de FORTRESS: lo que los agentes descubren de FORTRESS
 *  mismo mientras trabajan en otros proyectos, y las capacidades auto-propuestas. */
export function registerSystemHandlers(): void {
  ipcMain.handle(IPC.systemObservations, () => getAppContext().selfObservations.listOpen())

  ipcMain.handle(IPC.systemResolveObservation, (_event, id: string) =>
    getAppContext().selfObservations.resolve(id)
  )

  ipcMain.handle(IPC.systemCapabilities, () => {
    const ctx = getAppContext()
    return describeCapabilities(ctx.capabilities, ctx.runs)
  })

  ipcMain.handle(IPC.systemPromoteCapability, (_event, id: string, humanApproved: boolean) =>
    promoteCapability(getAppContext(), id, humanApproved)
  )
}
