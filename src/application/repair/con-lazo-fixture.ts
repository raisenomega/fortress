import { vi } from 'vitest'
import type { AppContext } from '../context'
import { conLazo } from './con-lazo'
import type { MotorChainDeps } from './run-motor-chain'
import * as otra from './otra-vuelta-del-generador'
import * as compilar from './run-gate'
import * as juzgar from './run-omega'
import { COMPLETO, PARCIAL } from './veredictos-fixture'

export { COMPLETO, PARCIAL }

/** Un libro con N vueltas ya dadas, cada una con su huella. */
export function libro(huellas: readonly (string | null)[]): readonly unknown[] {
  return huellas.map((huella, i) => ({
    id: `e${i}`, proposalId: 'p-1', seq: i + 1, phase: 'GENERATE', eventType: 'DECISION',
    actor: 'motor', ts: i, reason: 'HUELLA', evidenceJson: JSON.stringify({ huella })
  })) // prettier-ignore
}

export function banco(eventos: readonly unknown[], gastadoUsd = 0): AppContext {
  return {
    eventLog: { list: () => Promise.resolve(eventos) },
    runs: { costUsdOf: () => gastadoUsd }
  } as unknown as AppContext
}

/** Las tres piezas de una vuelta, dobladas. `verdicts` son los veredictos que
 *  OMEGA ira dando, uno por vuelta. */
export function vueltas(verdicts: readonly unknown[]): { generador: ReturnType<typeof vi.fn> } {
  const generador = vi.fn().mockResolvedValue({ ok: true, sesion: 'ses-nueva' })
  vi.spyOn(otra, 'otraVueltaDelGenerador').mockImplementation(generador as never)
  vi.spyOn(compilar, 'runGate').mockResolvedValue({ ok: true } as never)
  let i = 0
  vi.spyOn(juzgar, 'runOmega').mockImplementation((() => {
    const verdict = verdicts[i] ?? COMPLETO
    i += 1
    return Promise.resolve({ ok: true, verdict })
  }) as never)
  return { generador }
}

/** Las deps de la cadena, con la forma que el lazo recorre. Un `{}` pelado
 *  reventaba en `deps.judge.omega`, que es exactamente el tipo de doble que no
 *  se parece al original. */
const DEPS = { generate: {}, gate: {}, judge: { omega: {} } } as unknown as MotorChainDeps

/** `sesion` va SIN valor por defecto a proposito: con uno, pasar `undefined`
 *  para probar "sin sesion" lo rellenaba y la prueba medía otra cosa. */
export const correr = (
  ctx: AppContext,
  verdict: unknown,
  sesion: string | undefined
): ReturnType<typeof conLazo> =>
  conLazo(ctx, 'p-1', DEPS, { juicio: { omega: { ok: true, verdict }, merge: null } as never, sesion }) // prettier-ignore
