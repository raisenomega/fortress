import { ipcMain } from 'electron'
import { describeCapabilities } from '@application/system/describe-capabilities'
import { promoteCapability } from '@application/system/promote-capability'
import { proposeCapability } from '@application/system/propose-capability'
import { addCapabilityNote, listCapabilityNotes } from '@application/system/capability-notes'
import type { NewCapability } from '@domain/system/capability'
import type { NewCapabilityNote } from '@domain/system/capability-note'
import { registerAgentDraftHandlers } from './agent-draft-handlers'
import { registerCapabilityEpisodeHandlers } from './capability-episode-handlers'
import { registerGenesisHandlers } from './genesis-handlers'
import { exportObservations } from '../system/export-observations'
import { importAttended } from '../system/import-attended'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/** Backlog de auto-mejora de FORTRESS: lo que los agentes descubren de FORTRESS
 *  mismo mientras trabajan en otros proyectos, y las capacidades auto-propuestas. */
export function registerSystemHandlers(): void {
  ipcMain.handle(IPC.systemObservations, () => getAppContext().selfObservations.listOpen())

  // Devuelve la RUTA escrita: el operador tiene que saber donde buscarlo, y
  // quien lo lee desde la terminal, adonde ir.
  ipcMain.handle(IPC.systemExportObservations, () => exportObservations(getAppContext()))

  // La vuelta del bucle: lo que se atendio fuera se asienta aqui.
  ipcMain.handle(IPC.systemImportAttended, () => importAttended(getAppContext()))

  ipcMain.handle(IPC.systemResolveObservation, (_event, id: string) =>
    getAppContext().selfObservations.resolve(id)
  )

  ipcMain.handle(IPC.systemCapabilities, () => {
    const ctx = getAppContext()
    return describeCapabilities(ctx.capabilities, ctx.capabilityEpisodes)
  })

  ipcMain.handle(IPC.systemPromoteCapability, (_event, id: string, humanApproved: boolean) =>
    promoteCapability(getAppContext(), id, humanApproved)
  )

  ipcMain.handle(IPC.systemProposeCapability, (_event, input: NewCapability) =>
    proposeCapability(getAppContext(), input)
  )

  ipcMain.handle(IPC.systemCapabilityNotes, (_event, id: string) =>
    listCapabilityNotes(getAppContext(), id)
  )

  ipcMain.handle(IPC.systemAddCapabilityNote, (_event, input: NewCapabilityNote) =>
    addCapabilityNote(getAppContext(), input)
  )

  registerAgentDraftHandlers()
  registerCapabilityEpisodeHandlers()
  registerGenesisHandlers()
}
