import type { ModoDeVuelta } from '@domain/repair/modo-vuelta'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import type { GenerateDeps } from './generate-types'
import { generateFix } from './generate-fix'
import type { JudgeDeps } from './judge-and-integrate'
import { judgeAndIntegrate } from './judge-and-integrate'
import { esAveria } from '@domain/repair/averia'
import { desenlaceDelPlan, type ChainOutcome } from './motor-chain-outcome'
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
 * `err` se reserva a la averia del proveedor, lo unico que se arregla esperando.
 * Un veto, un gate rojo o un reloj agotado son desenlaces y salen como resultado:
 * quien envuelve esto reintenta sin descanso ante un error, asi que un desenlace
 * viajando como error mataria el ciclo por hacer lo que se le pide. Ver `esAveria`.
 *
 * `modo` parte la vuelta por donde el riesgo cambia de naturaleza: TRABAJAR
 * —elegir, entender, generar, compilar— ocurre entero dentro de un worktree y
 * no toca el arbol vivo; JUZGAR cuesta un revisor pero tampoco lo toca; INTEGRAR
 * si. Ver `ModoDeVuelta`. Por defecto, la conducta de siempre.
 */
export async function runMotorChain(
  ctx: AppContext,
  projectId: string,
  deps: MotorChainDeps,
  modo: ModoDeVuelta = 'completo'
): Promise<Result<ChainOutcome>> {
  // Sin hallazgo dirigido: la cola elige, y el modo le dice con que alcance.
  const plan = await planRepair(ctx, projectId, undefined, modo)
  if (!plan.ok) return ok(desenlaceDelPlan(plan.reason))
  const { proposal } = plan
  if (proposal.state !== 'ANALIZADO') return ok({ kind: 'obsoleto', proposalId: proposal.id })

  const generado = await generateFix(ctx, proposal.id, deps.generate)
  if (!generado.ok) return cortar(proposal.id, generado.reason)

  const gate = await runGate(ctx, proposal.id, deps.gate)
  if (!gate.ok) return cortar(proposal.id, gate.reason)
  // Hasta aqui nada salio del worktree. OMEGA no se ha llamado: la propuesta
  // queda en GATE, que no es terminal, asi que cuenta como viva y su hallazgo
  // no vuelve a salir elegido. Las siguientes vueltas atacan otros y se apilan.
  if (modo === 'hasta-gate') return ok({ kind: 'espera-omega', proposalId: proposal.id })

  // En hasta-omega el revisor juzga y ahi se para: un veto cierra en RECHAZADO
  // y no llega a la cola de firma; una aprobacion sale por `espera-firma` con
  // condicion nula, que es justo "aprobada sin que la politica llegara a mirar".
  const juicio = await judgeAndIntegrate(ctx, proposal.id, deps.judge, modo === 'completo')
  if (!juicio.omega.ok) return cortar(proposal.id, juicio.omega.reason)

  if (ctx.repairProposals.findById(proposal.id)?.state === 'MERGEADO') {
    return ok({ kind: 'integrada', proposalId: proposal.id })
  }
  // La condicion viaja tipada hasta aqui: quien cuente denegaciones necesita
  // saber CUAL freno, y `espera-firma` a secas las hacia indistinguibles.
  return ok({ kind: 'espera-firma', proposalId: proposal.id, condition: juicio.merge?.denial ?? null }) // prettier-ignore
}
