import { decidirOtraVuelta } from '@domain/repair/lazo-del-motor'
import { objecionComoEncargo } from '@domain/repair/objecion-de-omega'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { type DesenlaceDelLazo, resuelve } from './desenlace-del-lazo'
import type { JudgeResult } from './judge-and-integrate'
import { loQueElLazoVe } from './lo-que-el-lazo-ve'
import type { MotorChainDeps } from './run-motor-chain'
import { otraVueltaDelGenerador } from './otra-vuelta-del-generador'
import { runGate } from './run-gate'
import { runOmega } from './run-omega'

/**
 * El lazo (ADR-110): mientras OMEGA apruebe un PARCIAL y quede con que, otra
 * vuelta del generador sobre su propia sesion con la objecion del revisor.
 *
 * Ninguna parada es un fallo: converger es un desenlace. Lo que SI corta es que
 * un paso de la vuelta falle —el generador, el gate, el revisor—; entonces el
 * desenlace es el de ese paso y el libro ya lo cuenta, porque cada paso asienta
 * el suyo. Se juzga SIN integrar a proposito: integrar es de quien llama, y solo
 * cuando el lazo ha terminado de dar vueltas.
 */
export async function conLazo(
  ctx: AppContext,
  proposalId: string,
  deps: MotorChainDeps,
  primero: { readonly juicio: JudgeResult; readonly sesion: string | undefined }
): Promise<Result<DesenlaceDelLazo>> {
  let juicio = primero.juicio
  let sesion = primero.sesion ?? null
  let vueltas = 0

  for (;;) {
    // El caso normal sale ANTES de leer nada: un fix COMPLETO no tiene que
    // pagar una lectura del libro ni una consulta al libro mayor para que se le
    // diga que no hay nada que decidir.
    if (resuelve(juicio) !== 'PARCIAL') return ok({ juicio, vueltas, sesion, parada: 'completo' })
    const visto = await loQueElLazoVe(ctx, proposalId)
    const estado = { vueltasDadas: visto.vueltasDadas, huellasVistas: visto.anteriores, gastadoUsd: visto.gastadoUsd } // prettier-ignore
    const d = decidirOtraVuelta({ resuelve: 'PARCIAL', huella: visto.huella, sesion }, estado)
    if (!d.seguir) return ok({ juicio, vueltas, sesion, parada: d.parada })
    vueltas += 1

    const encargo = objecionComoEncargo(juicio.omega.ok ? juicio.omega.verdict.razon : '')
    const otra = await otraVueltaDelGenerador(ctx, proposalId, encargo, d.sesion, deps.generate)
    sesion = otra.sesion ?? sesion
    if (!otra.ok) return ok({ juicio, vueltas, sesion, parada: 'paso-fallido', cortado: otra.reason })

    const gate = await runGate(ctx, proposalId, deps.gate)
    if (!gate.ok) return ok({ juicio, vueltas, sesion, parada: 'paso-fallido', cortado: gate.reason })

    const omega = await runOmega(ctx, proposalId, deps.judge.omega)
    if (!omega.ok) return err(omega.reason)
    juicio = { omega, merge: null }
  }
}
