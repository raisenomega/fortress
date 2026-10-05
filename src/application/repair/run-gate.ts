import type { Result } from '@domain/shared/result'
import type { GateOutcome } from '@domain/repair/gate-result'
import { canTransition } from '@domain/repair/proposal'
import type { AppContext } from '../context'
import { cursorFrom } from './book-cursor'
import { emitGateCommand, emitGateOutcome } from './run-gate-emit'
import { cerrarElRojo, type CierreDelRojo } from './rojo-del-gate'
import { anotaciones, razonDelVerde } from './cierre-del-gate'
import { gateBlocked } from './gate-guards'

export interface GateDeps {
  readonly worktreeRoot: string
  readonly worktreeExists: (path: string) => boolean
  readonly isClean: (path: string) => Promise<boolean>
  readonly runner: { run(worktreePath: string, baseSha: string): Promise<GateOutcome> }
  /** Si la caja se puede levantar en esta maquina (ADR-092). Inyectada: es
   *  `bwrap` de verdad, y eso es infraestructura. */
  readonly hayCaja: () => Result<void>
  /** D16 — cola serial de UN gate a la vez a nivel de proceso. */
  readonly enqueue: (job: () => Promise<RunGateResult>) => Promise<RunGateResult>
  readonly now: () => number
}

/** El verde viaja con lo que se absolvio: el parte del drenaje lo necesita, y
 *  sin el campo tendria que volver a leer el libro para saberlo. */
export type RunGateResult = { ok: true; heredado?: readonly string[] } | CierreDelRojo

/**
 * I3 — el juicio hermetico del fix DENTRO del worktree. Verde total -> GATE
 * (esperando OMEGA); rojo o timeout -> RECHAZADO con autopsia y el worktree se
 * CONSERVA siempre.
 */
export async function runGate(
  ctx: AppContext,
  proposalId: string,
  deps: GateDeps,
  /** ADR-115 B2: SOLO la cadena del Motor lo pide. El boton «Gate» manual no. */
  opciones: { readonly aplazarRojo?: boolean } = {}
): Promise<RunGateResult> {
  const proposal = ctx.repairProposals.findById(proposalId)
  if (!proposal || proposal.state !== 'GENERADO') return { ok: false, reason: 'invalid_state' }
  const worktreePath = `${deps.worktreeRoot}/${proposal.id}`
  const cursor = cursorFrom(await ctx.eventLog.list(proposalId))

  const bloqueo = await gateBlocked(ctx, proposal, worktreePath, cursor, deps)
  if (bloqueo !== null) return bloqueo

  return deps.enqueue(async () => {
    const outcome = await deps.runner.run(worktreePath, proposal.baseSha)
    for (const command of outcome.commands) {
      await emitGateCommand(ctx.eventLog, cursor, proposal.id, command, deps.now())
    }
    if (!outcome.ok) return cerrarElRojo(ctx, cursor, proposal, outcome, deps.now(), opciones.aplazarRojo === true) // prettier-ignore
    if (!canTransition(proposal.state, 'GATE')) return { ok: false, reason: 'invalid_state' }
    ctx.repairProposals.update(proposal.id, {
      state: 'GATE',
      analysisVerdict: proposal.analysisVerdict ?? 'REAL',
      analysisReason: proposal.analysisReason ?? '',
      updatedAt: deps.now()
    })
    const total = outcome.commands.reduce((sum, c) => sum + c.durationMs, 0)
    // La RAZON, no solo la evidencia: es la unica linea del gate que el operador
    // lee en la fila de Firma sin abrir nada, y la que queda en el libro para
    // siempre. «gate verde» a secas es lo que dejo firmar ocho fixes con los
    // tests absueltos (DEUDAS §11.6).
    await emitGateOutcome(ctx.eventLog, cursor, proposal.id, 'GATE', razonDelVerde(outcome), { allCommandsGreen: true, totalDurationMs: total, ...anotaciones(outcome) }, deps.now()) // prettier-ignore
    return { ok: true, heredado: outcome.heredado }
  })
}
