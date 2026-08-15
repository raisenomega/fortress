import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAX_DENIALS,
  DEFAULT_MAX_NO_CANDIDATES,
  DEFAULT_RESCAN_EVERY,
  parseLoopBudget
} from './loop-budget'

/** Las tres valvulas leidas sin nada guardado: cada una con su default. */
const sinNada = (): ReturnType<typeof parseLoopBudget> =>
  parseLoopBudget(null, null, null, null, null)

describe('las denegaciones seguidas que se toleran', () => {
  it('sin fijar hereda el default', () => {
    expect(sinNada().maxConsecutiveDenials).toBe(DEFAULT_MAX_DENIALS)
  })

  it('basura tambien hereda el default: no hay intencion legible', () => {
    const b = parseLoopBudget(null, null, 'abc', null, null)
    expect(b.maxConsecutiveDenials).toBe(DEFAULT_MAX_DENIALS)
  })

  it('un cero guardado es un cero, no una ausencia', () => {
    // Aplanar los dos en 0 haria indistinguible "no configurado" de lo que el
    // operador escribio a mano, y el default se comeria su decision.
    expect(parseLoopBudget(null, null, '0', null, null).maxConsecutiveDenials).toBe(0)
  })
})

describe('la cadencia de re-escaneo', () => {
  it('sin fijar hereda el default', () => {
    expect(sinNada().rescanEvery).toBe(DEFAULT_RESCAN_EVERY)
  })

  it('un cero guardado pide escanear siempre, y sobrevive como cero', () => {
    // No es "no escanear nunca": con cero integraciones acumuladas la condicion
    // ya se cumple, asi que cada vuelta mide. Es el comportamiento de antes.
    expect(parseLoopBudget(null, null, null, '0', null).rescanEvery).toBe(0)
  })
})

describe('las vueltas en vacio que se toleran', () => {
  it('sin fijar hereda el default, mas alto que el de denegaciones', () => {
    // No hay trabajo es benigno y puede deshacerse solo en cuanto el proximo
    // escaneo traiga hallazgos; una denegacion es la politica frenando trabajo
    // que si existe. Distinta senal, distinta paciencia.
    const b = sinNada()
    expect(b.maxConsecutiveNoCandidates).toBe(DEFAULT_MAX_NO_CANDIDATES)
    expect(b.maxConsecutiveNoCandidates).toBeGreaterThan(b.maxConsecutiveDenials)
  })

  it('un cero guardado sobrevive como cero', () => {
    expect(parseLoopBudget(null, null, null, null, '0').maxConsecutiveNoCandidates).toBe(0)
  })
})
