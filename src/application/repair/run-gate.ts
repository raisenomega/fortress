import type { GateOutcome } from '@domain/repair/gate-result'
import { canTransition } from '@domain/repair/proposal'
import type { AppContext } from '../context'
import { cursorFrom } from './book-cursor'
import { emitGateCommand, emitGateOutcome, rejectGate } from './run-gate-emit'

/** Lo no verificado y lo que ya venia roto, en la evidencia y solo si los hubo:
 *  el libro no afirma "no hubo" cuando la pregunta no aplicaba. */
const anotaciones = (o: GateOutcome): Record<string, readonly string[]> => ({
  ...(o.skipped?.length ? { skipped: o.skipped } : {}),
  ...(o.heredado?.length ? { heredado: o.heredado } : {})
})

export interface GateDeps {
  readonly worktreeRoot: string
  readonly worktreeExists: (path: string) => boolean
  readonly isClean: (path: string) => Promise<boolean>
  readonly runner: { run(worktreePath: string, baseSha: string): Promise<GateOutcome> }
  /** D16 — cola serial de UN gate a la vez a nivel de proceso. */
  readonly enqueue: (job: () => Promise<RunGateResult>) => Promise<RunGateResult>
  readonly now: () => number
}

export type RunGateResult = { ok: true } | { ok: false; reason: string }

/**
 * I3 — el juicio hermetico del fix DENTRO del worktree. Verde total -> GATE
 * (esperando OMEGA); rojo o timeout -> RECHAZADO con autopsia y el worktree se
 * CONSERVA siempre.
 */
export async function runGate(
  ctx: AppContext,
  proposalId: string,
  deps: GateDeps
): Promise<RunGateResult> {
  const proposal = ctx.repairProposals.findById(proposalId)
  if (!proposal || proposal.state !== 'GENERADO') return { ok: false, reason: 'invalid_state' }
  const worktreePath = `${deps.worktreeRoot}/${proposal.id}`
  const cursor = cursorFrom(await ctx.eventLog.list(proposalId))

  if (!deps.worktreeExists(worktreePath)) {
    return rejectGate(ctx, cursor, proposal, 'worktree_missing', 'worktree_missing', { worktreePath }, deps.now()) // prettier-ignore
  }
  if (!(await deps.isClean(worktreePath))) {
    // Cambios sin commit despues de GENERADO: alguien (o algo) toco el worktree.
    return rejectGate(ctx, cursor, proposal, 'worktree_contaminated', 'worktree_contaminated', {}, deps.now()) // prettier-ignore
  }

  return deps.enqueue(async () => {
    const outcome = await deps.runner.run(worktreePath, proposal.baseSha)
    for (const command of outcome.commands) {
      await emitGateCommand(ctx.eventLog, cursor, proposal.id, command, deps.now())
    }
    if (!outcome.ok) {
      const detail = `gate_failed_at=${outcome.failedAt}`
      const roto = outcome.commands.at(-1)
      return rejectGate(ctx, cursor, proposal, outcome.reason, detail, {
        failedAt: outcome.failedAt, reason: outcome.reason,
        exitCode: roto?.exitCode, timedOut: roto?.timedOut, ...anotaciones(outcome)
      }, deps.now()) // prettier-ignore
    }
    if (!canTransition(proposal.state, 'GATE')) return { ok: false, reason: 'invalid_state' }
    ctx.repairProposals.update(proposal.id, {
      state: 'GATE',
      analysisVerdict: proposal.analysisVerdict ?? 'REAL',
      analysisReason: proposal.analysisReason ?? '',
      updatedAt: deps.now()
    })
    const total = outcome.commands.reduce((sum, c) => sum + c.durationMs, 0)
    await emitGateOutcome(ctx.eventLog, cursor, proposal.id, 'GATE', 'gate verde', { allCommandsGreen: true, totalDurationMs: total, ...anotaciones(outcome) }, deps.now()) // prettier-ignore
    return { ok: true }
  })
}
