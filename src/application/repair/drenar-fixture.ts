import { vi } from 'vitest'
import type { AppContext } from '../context'
import type { ChainOutcome } from './motor-chain-outcome'
import * as cadena from './run-motor-chain'
import type { DrenajeDeps } from './drenar-hasta-omega'

export const CTX = {} as AppContext
export const VACIO: ChainOutcome = { kind: 'sin-candidato' }
export const espera = (id: string): ChainOutcome => ({ kind: 'espera-firma', proposalId: id, condition: null }) // prettier-ignore

/** El motor doblado: devuelve estas vueltas en orden y luego sin-candidato. */
export function motor(...vueltas: readonly ChainOutcome[]): ReturnType<typeof vi.spyOn> {
  let i = 0
  return vi.spyOn(cadena, 'runMotorChain').mockImplementation(() => {
    const v = vueltas[i] ?? VACIO
    i += 1
    return Promise.resolve({ ok: true, value: v })
  })
}

export const deps = (over: Partial<DrenajeDeps> = {}): DrenajeDeps => ({
  motor: {} as DrenajeDeps['motor'],
  cancelado: () => false,
  gastado: () => 0,
  topeDiario: () => null,
  maxVueltas: 6,
  costCapUsd: 25,
  ...over
})
