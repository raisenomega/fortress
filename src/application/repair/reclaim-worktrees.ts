import type { AppContext } from '../context'
import { cursorFrom, emitOutcome } from './record-generate-events'

export interface ReclaimDeps {
  /** Nombres de dir bajo la raiz de worktrees = ids de propuesta. */
  listWorktreeDirs(): string[]
  pathOf(proposalId: string): string
  /** git worktree remove --force desde el repo del proyecto. */
  removeWorktree(worktreePath: string, projectRepoPath: string): Promise<void>
  /** Huerfano total (sin propuesta o sin proyecto): rm del dir, git no ayuda. */
  rmDir(path: string): void
  now(): number
}

const TERMINAL: ReadonlySet<string> = new Set(['MERGEADO', 'RECHAZADO', 'CADUCADO'])

/**
 * Al arrancar: los worktrees que quedaron de una sesion anterior se reconcilian
 * con su propuesta. ANALIZADO con dir = crash a medio generar -> RECHAZADO
 * orphan_before_generate. GENERADO se conserva (espera I3+). Falla suave: la
 * limpieza jamas aborta el arranque.
 */
export async function reclaimWorktrees(
  ctx: AppContext,
  deps: ReclaimDeps
): Promise<{ reclaimed: number; cleaned: number }> {
  let reclaimed = 0
  let cleaned = 0
  for (const id of deps.listWorktreeDirs()) {
    const path = deps.pathOf(id)
    try {
      const proposal = ctx.repairProposals.findById(id)
      if (!proposal) {
        deps.rmDir(path)
        cleaned += 1
        continue
      }
      const repo = ctx.projects.findById(proposal.projectId)?.path ?? null
      const remove = (): Promise<void> | void =>
        repo === null ? deps.rmDir(path) : deps.removeWorktree(path, repo)

      if (TERMINAL.has(proposal.state)) {
        await remove()
        cleaned += 1
      } else if (proposal.state === 'ANALIZADO') {
        const cursor = cursorFrom(await ctx.eventLog.list(id))
        ctx.repairProposals.update(id, { state: 'RECHAZADO', analysisVerdict: proposal.analysisVerdict ?? 'REAL', analysisReason: 'orphan_before_generate', updatedAt: deps.now() }) // prettier-ignore
        await emitOutcome(ctx.eventLog, cursor, id, 'RECHAZADO', 'orphan_before_generate', {}, deps.now()) // prettier-ignore
        await remove()
        reclaimed += 1
      }
      // GENERADO (y estados posteriores) se conservan: los espera I3+.
    } catch (error) {
      console.error('[repair-cleanup] fallo limpiando', id, error)
    }
  }
  console.info(`[repair-cleanup] reclaimed=${reclaimed} cleaned=${cleaned}`)
  return { reclaimed, cleaned }
}
