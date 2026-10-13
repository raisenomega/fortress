import type { FindingMemory } from '@domain/project/finding-memory'
import { seExtinguio } from '@domain/project/se-extinguio'
import { ipcMain } from 'electron'
import { commitDurableDelLazo } from '../git/commit-durable-del-lazo'
import { popDelLazo, stashDelLazo } from '../git/stash-del-lazo'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

const pathDe = (projectId: string): string =>
  getAppContext().projects.findById(projectId)?.path ?? ''

const hallazgo = (projectId: string, findingId: string): FindingMemory | undefined =>
  getAppContext()
    .findings.listMemory(projectId)
    .find((f) => f.id === findingId)

/** El titulo del hallazgo, de la BASE: el main no se fia del renderer (ADR-088). */
const tituloDe = (projectId: string, findingId: string): string =>
  hallazgo(projectId, findingId)?.title ?? ''

/**
 * Los canales git del LAZO autonomo (ATERRIZAJE-4): COMMIT DURABLE del trabajo
 * del agente y STASH/POP del WIP para dejar el arbol limpio. El main resuelve
 * path y titulo de la base; el commit respeta el guard self-repo y nunca pushea.
 */
export function registerLazoHandlers(): void {
  ipcMain.handle(IPC.repairLazoCommit, (_e, projectId: string, findingId: string) => {
    const path = pathDe(String(projectId))
    if (path === '') return 'error'
    return commitDurableDelLazo(
      path,
      String(findingId),
      tituloDe(String(projectId), String(findingId))
    )
  })
  ipcMain.handle(IPC.repairLazoStash, (_e, projectId: string) =>
    stashDelLazo(pathDe(String(projectId)))
  )
  ipcMain.handle(IPC.repairLazoPop, (_e, projectId: string) =>
    popDelLazo(pathDe(String(projectId)))
  )
  ipcMain.handle(IPC.repairLazoExtinto, (_e, projectId: string, findingId: string) =>
    seExtinguio(hallazgo(String(projectId), String(findingId))?.lifecycle ?? null)
  )
}
