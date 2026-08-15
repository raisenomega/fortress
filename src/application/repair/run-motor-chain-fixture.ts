import { vi } from 'vitest'
import type { AppContext } from '../context'
import type { MotorChainDeps } from './run-motor-chain'
import * as generar from './generate-fix'
import * as juzgar from './judge-and-integrate'
import * as elegir from './plan-repair'
import * as compilar from './run-gate'

/** Los cuatro pasos doblados: la cadena se prueba sin lanzar un solo proceso. */
export const DEPS = {} as unknown as MotorChainDeps
export const PROPUESTA = { id: 'prop-1234abcd', state: 'ANALIZADO' }

export function ctx(estadoFinal = 'OMEGA'): AppContext {
  return { repairProposals: { findById: () => ({ state: estadoFinal }) } } as unknown as AppContext
}

export const elige = (p: unknown): void =>
  void vi.spyOn(elegir, 'planRepair').mockResolvedValue(p as never)
export const genera = (r: unknown): void => void vi.spyOn(generar, 'generateFix').mockResolvedValue(r as never) // prettier-ignore
export const compila = (r: unknown): void =>
  void vi.spyOn(compilar, 'runGate').mockResolvedValue(r as never)
export const juzga = (r: unknown): void => void vi.spyOn(juzgar, 'judgeAndIntegrate').mockResolvedValue(r as never) // prettier-ignore

export const verde = (): void => {
  elige(PROPUESTA)
  genera({ ok: true })
  compila({ ok: true })
  juzga({ ok: true })
}
