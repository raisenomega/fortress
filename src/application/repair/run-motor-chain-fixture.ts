import { vi } from 'vitest'
import type { AppContext } from '../context'
import type { MotorChainDeps } from './run-motor-chain'
import { COMPLETO } from './veredictos-fixture'
import * as generar from './generate-fix'
import * as integrar from './integrar-si-procede'
import * as juzgar from './judge-and-integrate'
import * as elegir from './plan-repair'
import * as compilar from './run-gate'

/** Los cuatro pasos doblados: la cadena se prueba sin lanzar un solo proceso. */
export const DEPS = {} as unknown as MotorChainDeps
export const PROPUESTA = { id: 'prop-1234abcd', state: 'ANALIZADO' }

/**
 * El contexto doblado. Lleva `eventLog` y `runs` porque desde el lazo (ADR-110)
 * la cadena LEE el libro y el libro mayor para decidir si da otra vuelta: un
 * doble sin ellos no se parece al original y probaria otra cosa (DEUDAS §13).
 */
export function ctx(estadoFinal = 'OMEGA', eventos: readonly unknown[] = []): AppContext {
  return {
    repairProposals: { findById: () => ({ state: estadoFinal }) },
    eventLog: { list: () => Promise.resolve(eventos) },
    runs: { costUsdOf: () => 0 }
  } as unknown as AppContext
}

/** El plan encuentra a quien atender. `null` mantiene el caso «sin candidato». */
export const elige = (p: unknown): void =>
  void vi.spyOn(elegir, 'planRepair').mockResolvedValue(
    (p === null ? { ok: false, reason: 'sin-candidato' } : { ok: true, proposal: p }) as never
  )

/** El plan NIEGA con su motivo: el otro camino que la cadena tiene que leer. */
export const niega = (reason: string): void =>
  void vi.spyOn(elegir, 'planRepair').mockResolvedValue({ ok: false, reason } as never)
export const genera = (r: unknown): void => void vi.spyOn(generar, 'generateFix').mockResolvedValue(r as never) // prettier-ignore
export const compila = (r: unknown): void =>
  void vi.spyOn(compilar, 'runGate').mockResolvedValue(r as never)
export const juzga = (r: unknown): void => void vi.spyOn(juzgar, 'judgeAndIntegrate').mockResolvedValue(r as never) // prettier-ignore

/** Aprueba con el veredicto dado (COMPLETO por defecto) y sin integrar. */
export const aprueba = (verdict: unknown = COMPLETO): void =>
  juzga({ omega: { ok: true, verdict }, merge: null })

/**
 * El juicio aprueba y la politica freno con esta condicion (null: ni se miro).
 *
 * Se dobla `integrarSiProcede` y no el juicio porque desde el lazo (ADR-110) la
 * integracion ya no cuelga del juicio: se juzga sin integrar tantas veces como
 * vueltas haya, y se integra UNA, al final.
 */
export const frena = (denial: unknown): void => {
  aprueba()
  vi.spyOn(integrar, 'integrarSiProcede').mockResolvedValue({ applied: false, denial } as never)
}

export const verde = (): void => {
  elige(PROPUESTA)
  genera({ ok: true })
  compila({ ok: true })
  aprueba()
}
