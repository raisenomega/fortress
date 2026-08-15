import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import type { GenerateDeps } from './generate-types'
import { generateFix } from './generate-fix'
import type { JudgeDeps } from './judge-and-integrate'
import { judgeAndIntegrate } from './judge-and-integrate'
import { esAveria, type ChainOutcome } from './motor-chain-outcome'
import { planRepair } from './plan-repair'
import { runGate, type GateDeps } from './run-gate'

export interface MotorChainDeps {
  readonly generate: GenerateDeps
  readonly gate: GateDeps
  readonly judge: JudgeDeps
}

/** Un rechazo de paso: o es averia del proveedor, o es un veredicto. */
const cortar = (proposalId: string, motivo: string): Result<ChainOutcome> =>
  esAveria(motivo) ? err(motivo) : ok({ kind: 'descartada', proposalId, motivo })

/**
 * Una vuelta entera del motor sobre un proyecto: elegir, entender, generar,
 * compilar, juzgar y —si la politica lo permite— integrar.
 *
 * La cadena no existia. El operador la conducia a mano, un boton por paso, y
 * cada handler sabia solo del suyo. Aqui esta escrita una vez para que la pueda
 * recorrer tambien quien no tiene dedos.
 *
 * `err` se reserva a la averia del proveedor, que es lo unico que se arregla
 * esperando. Un veto del revisor o un gate en rojo son veredictos y salen como
 * resultado: quien envuelve esto reintenta sin descanso ante un error y se muere
 * ante el que no reconoce, asi que un veredicto viajando como error mataria el
 * ciclo por hacer exactamente lo que se le pide.
 */
export async function runMotorChain(
  ctx: AppContext,
  projectId: string,
  deps: MotorChainDeps
): Promise<Result<ChainOutcome>> {
  const proposal = await planRepair(ctx, projectId)
  if (proposal === null) return ok({ kind: 'sin-candidato' })
  if (proposal.state !== 'ANALIZADO') return ok({ kind: 'obsoleto', proposalId: proposal.id })

  const generado = await generateFix(ctx, proposal.id, deps.generate)
  if (!generado.ok) return cortar(proposal.id, generado.reason)

  const gate = await runGate(ctx, proposal.id, deps.gate)
  if (!gate.ok) return cortar(proposal.id, gate.reason)

  const juicio = await judgeAndIntegrate(ctx, proposal.id, deps.judge)
  if (!juicio.ok) return cortar(proposal.id, juicio.reason)

  const estado = ctx.repairProposals.findById(proposal.id)?.state
  const kind = estado === 'MERGEADO' ? 'integrada' : 'espera-firma'
  return ok({ kind, proposalId: proposal.id })
}
