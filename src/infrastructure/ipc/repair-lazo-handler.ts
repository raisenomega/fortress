import type { FindingMemory } from '@domain/project/finding-memory'
import { seExtinguio } from '@domain/project/se-extinguio'
import { ejecutaConConfianza } from '@domain/repair/confianza'
import { ipcMain } from 'electron'
import { commitDurableDelLazo } from '../git/commit-durable-del-lazo'
import { type DesenlacePop, popDelLazo, stashDelLazo } from '../git/stash-del-lazo'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/** add -A, stash -u y pop corren filtros del repo fuera de la caja: es ejecutar y pide
 *  confianza (ADR-044). Sin proyecto o sin confianza: ruta vacia, el canal no toca git. */
function pathEjecutable(projectId: string): string {
  const project = getAppContext().projects.findById(projectId)
  if (project === null) return ''
  if (ejecutaConConfianza(project)) return project.path
  console.warn(`[lazo] proyecto sin confianza: no se toca git en ${projectId}`)
  return ''
}

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
    const path = pathEjecutable(String(projectId))
    if (path === '') return 'error'
    return commitDurableDelLazo(
      path,
      String(findingId),
      tituloDe(String(projectId), String(findingId))
    )
  })
  ipcMain.handle(IPC.repairLazoStash, (_e, projectId: string) => {
    const path = pathEjecutable(String(projectId))
    return path === '' ? false : stashDelLazo(path)
  })
  // Rechazado sale 'conflicto', no 'vacio': el WIP sigue en el stash y se reporta.
  ipcMain.handle(IPC.repairLazoPop, (_e, projectId: string): DesenlacePop => {
    const path = pathEjecutable(String(projectId))
    return path === '' ? 'conflicto' : popDelLazo(path)
  })
  ipcMain.handle(IPC.repairLazoExtinto, (_e, projectId: string, findingId: string) =>
    seExtinguio(hallazgo(String(projectId), String(findingId))?.lifecycle ?? null)
  )
}
