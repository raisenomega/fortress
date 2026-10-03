import type { ModoDeVuelta } from '@domain/repair/modo-vuelta'
import { ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { asentarParadaDelLazo } from './asentar-parada-del-lazo'
import type { DesenlaceDelLazo } from './desenlace-del-lazo'
import { integrarSiProcede } from './integrar-si-procede'
import type { JudgeDeps } from './judge-and-integrate'
import type { ChainOutcome } from './motor-chain-outcome'

/**
 * Como termina la vuelta cuando el lazo ya no da mas (ADR-110).
 *
 * La integracion va AQUI y no pegada al juicio: el lazo juzga varias veces y se
 * integra UNA, con el veredicto de la ultima vuelta. Un veto de esa ultima
 * vuelta ya cerro la propuesta en RECHAZADO por su camino, asi que aqui solo se
 * integra lo APROBADO, y solo en `completo`.
 */
export async function cerrarLaCadena(
  ctx: AppContext,
  proposalId: string,
  deps: JudgeDeps,
  lazo: DesenlaceDelLazo,
  modo: ModoDeVuelta,
  heredado: readonly string[] | undefined
): Promise<Result<ChainOutcome>> {
  // El recibo ANTES de integrar: la parada ya esta decidida y el libro la
  // cuenta aunque el merge de despues falle por lo suyo (DEUDAS §15.2).
  await asentarParadaDelLazo(ctx, proposalId, lazo)
  const final = lazo.juicio
  const aprobado = final.omega.ok && final.omega.verdict.veredicto_global === 'APROBADO'
  const merge = modo === 'completo' && aprobado ? await integrarSiProcede(ctx, proposalId, deps) : final.merge // prettier-ignore

  if (ctx.repairProposals.findById(proposalId)?.state === 'MERGEADO') {
    return ok({ kind: 'integrada', proposalId })
  }
  // La condicion viaja tipada: quien cuente denegaciones necesita saber CUAL
  // freno, y `espera-firma` a secas las hacia indistinguibles.
  return ok({ kind: 'espera-firma', proposalId, condition: merge?.denial ?? null, ...(heredado?.length ? { heredado } : {}) }) // prettier-ignore
}
