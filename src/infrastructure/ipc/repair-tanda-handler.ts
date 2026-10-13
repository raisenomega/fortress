import { ipcMain } from 'electron'
import { medirLaTanda, type ResultadoDeTanda } from '@application/repair/medir-la-tanda'
import { propuestasDeTanda, type PropuestaEnCola } from '@application/repair/tanda-de-firma'
import { ejecutaConConfianza } from '@domain/repair/confianza'
import { ordenDeFirma, type GuiaDeOrden } from '@domain/repair/orden-de-firma'
import { err, ok, type Result } from '@domain/shared/result'
import { getAppContext } from '../persistence/app-context'
import { worktreeRoot } from '../repair/repair-deps'
import { sondaDeLaTanda } from '../repair/sonda-de-la-tanda'
import { endMerge } from '../run-control'
import { guardMerge } from '../run-guard'
import { IPC } from './channels'

/** La sonda real: cada id, su worktree y su rama; el gate, el de la medida. */
const sondaDe = (projectId: string, projectPath: string, cola: readonly PropuestaEnCola[]) => {
  const porId = new Map(cola.map((p) => [p.id, p]))
  return (ids: readonly string[]): ReturnType<typeof sondaDeLaTanda> =>
    sondaDeLaTanda(projectId, ids.map((id) => ({ id, worktreePath: `${worktreeRoot()}/${id}`, branch: porId.get(id)?.branch ?? '' })), projectPath) // prettier-ignore
}

/**
 * Deuda #2: la guia del orden de firma. Dos canales, dos costes. La GUIA es
 * estatica y se sirve al cargar la pagina; MEDIR ocupa el carril del merge
 * —la sonda trabaja sobre el worktree de una propuesta real, el mismo recurso
 * que la firma— y por eso pide turno igual que ella. Ningun camino toca las
 * politicas firmadas: aqui no se firma, no se integra y no se caduca nada.
 */
export function registerTandaHandlers(): void {
  ipcMain.handle(
    IPC.repairGuiaDeFirma,
    async (_event, projectId: string): Promise<{ n: number; guia: GuiaDeOrden }> => {
      // prettier-ignore
      const cola = await propuestasDeTanda(getAppContext(), String(projectId))
      return { n: cola.length, guia: ordenDeFirma(cola) }
    }
  )

  ipcMain.handle(
    IPC.repairMedirTanda,
    async (_event, projectId: string): Promise<Result<ResultadoDeTanda>> => {
      // prettier-ignore
      const context = getAppContext()
      const id = String(projectId)
      const project = context.projects.findById(id)
      if (project === null) return err('project-not-found')
      // La sonda corre el gate (codigo del repo): sin confianza no se mide (ADR-044).
      if (!ejecutaConConfianza(project)) return err('proyecto_sin_confianza')
      const busy = guardMerge(context, id)
      if (busy !== null) return err(busy)
      try {
        const cola = await propuestasDeTanda(context, id)
        return ok(await medirLaTanda(cola, sondaDe(id, project.path, cola)))
      } finally {
        endMerge(id)
      }
    }
  )
}
