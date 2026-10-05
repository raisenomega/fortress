import type { ModoDeVuelta } from '@domain/repair/modo-vuelta'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import type { GenerateDeps } from './generate-types'
import { generateFix } from './generate-fix'
import type { JudgeDeps } from './judge-and-integrate'
import { judgeAndIntegrate } from './judge-and-integrate'
import { esAveria, motivoDeAveria } from '@domain/repair/averia'
import { desenlaceDelPlan, type ChainOutcome } from './motor-chain-outcome'
import { cerrarLaCadena } from './cierre-de-la-cadena'
import { conLazo } from './con-lazo'
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
 * Escrita una vez para que la recorra tambien quien no tiene dedos.
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
  // Una AVERIA del analista (proveedor, CLI sin arrancar) corta como la del
  // generador: antes salia como `obsoleto` y la tanda quemaba la baraja (05-oct).
  const averia = proposal.state === 'ANALIZADO' ? null : motivoDeAveria(proposal.analysisReason ?? '')
  if (averia !== null) return err(averia)
  if (proposal.state !== 'ANALIZADO') return ok({ kind: 'obsoleto', proposalId: proposal.id })

  const generado = await generateFix(ctx, proposal.id, deps.generate)
  if (!generado.ok) return cortar(proposal.id, generado.reason)

  const gate = await runGate(ctx, proposal.id, deps.gate)
  if (!gate.ok) return cortar(proposal.id, gate.reason)
  // OMEGA no se ha llamado: la propuesta queda en GATE (viva), su hallazgo no
  // vuelve a salir elegido y las siguientes vueltas atacan otros.
  if (modo === 'hasta-gate') return ok({ kind: 'espera-omega', proposalId: proposal.id, ...(gate.heredado?.length ? { heredado: gate.heredado } : {}) }) // prettier-ignore

  // SIEMPRE sin integrar, tambien en `completo`: entre el juicio y el merge vive
  // el LAZO (ADR-110), y un PARCIAL integrado antes de darle su vuelta es justo
  // lo que el lazo existe para no hacer. Integrar es de `cerrarLaCadena`.
  const juicio = await judgeAndIntegrate(ctx, proposal.id, deps.judge, false)
  if (!juicio.omega.ok) return cortar(proposal.id, juicio.omega.reason)

  const lazo = await conLazo(ctx, proposal.id, deps, { juicio, sesion: generado.sesion })
  if (!lazo.ok) return cortar(proposal.id, lazo.error)
  return cerrarLaCadena(ctx, proposal.id, deps.judge, lazo.value, modo, gate.heredado)
}
