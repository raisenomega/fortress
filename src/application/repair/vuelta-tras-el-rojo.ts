import { decidirOtraVuelta } from '@domain/repair/lazo-del-motor'
import { rojoComoEncargo } from '@domain/repair/rojo-como-encargo'
import type { AppContext } from '../context'
import { loQueElLazoVe } from './lo-que-el-lazo-ve'
import { otraVueltaDelGenerador } from './otra-vuelta-del-generador'
import { rechazarAplazado } from './rojo-del-gate'
import { runGate, type RunGateResult } from './run-gate'
import type { MotorChainDeps } from './run-motor-chain'

export type GateConVuelta = RunGateResult & { readonly sesion?: string }

/**
 * El gate de la cadena del Motor (ADR-115 B2, enmienda de ADR-110): un rojo de
 * CODIGO con lineas de error no mata la propuesta en el acto. Se le da al
 * generador UNA vuelta sobre su sesion, con el error, y el gate se repite.
 *
 * Es el lazo de siempre con otro disparo, no otro lazo: `decidirOtraVuelta` con
 * las mismas cuentas del libro (vueltas dadas, huellas, dolares), asi que un
 * rojo no trae presupuesto propio. Si no hay vuelta, o la vuelta no llega a
 * dejar un fix, el rechazo que se aplazo se escribe identico al de siempre.
 * El segundo gate ya NO aplaza: tras la vuelta, un rojo es un rojo.
 */
export async function gateConVuelta(
  ctx: AppContext,
  proposalId: string,
  deps: MotorChainDeps,
  sesion: string | undefined
): Promise<GateConVuelta> {
  const primero = await runGate(ctx, proposalId, deps.gate, { aplazarRojo: true })
  if (primero.ok || primero.aplazado === undefined) return primero
  const rojo = primero.aplazado

  const visto = await loQueElLazoVe(ctx, proposalId)
  const estado = { vueltasDadas: visto.vueltasDadas, huellasVistas: visto.anteriores, gastadoUsd: visto.gastadoUsd } // prettier-ignore
  const d = decidirOtraVuelta({ resuelve: 'ROJO', huella: visto.huella, sesion: sesion ?? null }, estado) // prettier-ignore
  if (!d.seguir) return rechazarAplazado(ctx, proposalId, rojo, deps.gate.now())

  const encargo = rojoComoEncargo(rojo.failedAt, rojo.errores)
  const otra = await otraVueltaDelGenerador(ctx, proposalId, encargo, d.sesion, deps.generate, 'GENERADO') // prettier-ignore
  if (!otra.ok) {
    // Si la vuelta ya escribio su RECHAZADO, esto no hace nada: solo cierra el
    // caso de una vuelta que no llego a tocar la propuesta.
    await rechazarAplazado(ctx, proposalId, rojo, deps.gate.now())
    return { ok: false, reason: otra.reason }
  }
  const segundo = await runGate(ctx, proposalId, deps.gate)
  return segundo.ok ? { ...segundo, sesion: otra.sesion ?? d.sesion } : segundo
}
