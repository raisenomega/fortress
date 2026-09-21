import { ejecutaConConfianza } from '@domain/repair/confianza'
import type { Proposal } from '@domain/repair/proposal'
import type { AppContext } from '../context'
import type { BookCursor } from './book-cursor'
import { rejectGate } from './run-gate-emit'
import type { GateDeps, RunGateResult } from './run-gate'

/**
 * Lo que hay que comprobar ANTES de correr nada dentro del worktree. Devuelve el
 * rechazo ya asentado, o null si el gate puede seguir.
 *
 * La confianza va con las otras dos y no en `guardRun`: alli bloquearia tambien
 * el ESCANEO, que es de solo lectura y es justo lo que se hace para decidir si
 * confiar. Poner la guarda donde se ejecuta —y no donde se gasta— es lo que
 * permite seguir evaluando un proyecto ajeno sin correr su codigo.
 */
export async function gateBlocked(
  ctx: AppContext,
  proposal: Proposal,
  worktreePath: string,
  cursor: BookCursor,
  deps: GateDeps
): Promise<RunGateResult | null> {
  if (!deps.worktreeExists(worktreePath)) {
    return rejectGate(ctx, cursor, proposal, 'worktree_missing', 'worktree_missing', { worktreePath }, deps.now()) // prettier-ignore
  }
  if (!(await deps.isClean(worktreePath))) {
    // Cambios sin commit despues de GENERADO: alguien (o algo) toco el worktree.
    return rejectGate(ctx, cursor, proposal, 'worktree_contaminated', 'worktree_contaminated', {}, deps.now()) // prettier-ignore
  }
  // `npm ci` corre los scripts del repo auditado (preinstall, prepare) y los tres
  // `npm run` son suyos tambien: sin confianza esto es ejecutar codigo ajeno con
  // el usuario del operador. Acotar el entorno no basta — el codigo sigue viendo
  // el disco.
  const project = ctx.projects.findById(proposal.projectId)
  if (!ejecutaConConfianza(project)) {
    return rejectGate(ctx, cursor, proposal, 'proyecto_sin_confianza', 'proyecto_sin_confianza', {}, deps.now()) // prettier-ignore
  }
  return guardSandbox(ctx, proposal, cursor, deps)
}

/**
 * Sin caja no hay gate (ADR-092, casilla 4), y se dice ANTES de correr nada:
 * si `npm ci` saliera 127 desde dentro, el libro lo apuntaria como
 * `npm_ci_failed` —culpa del fix— cuando la culpa es de la maquina. Va DESPUES
 * de la confianza: un proyecto sin confianza se rechaza por eso, con o sin caja.
 * `guard…`: `innegociables-derivados` la protege del auto-merge por el nombre.
 */
export async function guardSandbox(
  ctx: AppContext,
  proposal: Proposal,
  cursor: BookCursor,
  deps: GateDeps
): Promise<RunGateResult | null> {
  const caja = deps.hayCaja()
  if (caja.ok) return null
  return rejectGate(
    ctx,
    cursor,
    proposal,
    'sin_caja',
    'sin_caja',
    { motivo: caja.error },
    deps.now()
  )
}
