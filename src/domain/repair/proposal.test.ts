import { describe, expect, it } from 'vitest'
import { canTransition, type ProposalState } from './proposal'

const ESTADOS: readonly ProposalState[] = [
  'ELEGIDO', 'ANALIZADO', 'GENERADO', 'GATE', 'OMEGA',
  'APROBADO', 'RECHAZADO', 'MERGEADO', 'CADUCADO'
] // prettier-ignore

/** La maquina acordada, entera: lo que no esta aqui debe rechazarse. */
const VALIDAS: ReadonlyArray<readonly [ProposalState, ProposalState]> = [
  ['ELEGIDO', 'ANALIZADO'], ['ELEGIDO', 'CADUCADO'],
  ['ANALIZADO', 'GENERADO'], ['ANALIZADO', 'CADUCADO'],
  ['GENERADO', 'GATE'], ['GENERADO', 'CADUCADO'],
  ['GATE', 'OMEGA'], ['GATE', 'RECHAZADO'], ['GATE', 'CADUCADO'],
  ['OMEGA', 'APROBADO'], ['OMEGA', 'RECHAZADO'], ['OMEGA', 'CADUCADO'],
  ['APROBADO', 'MERGEADO'], ['APROBADO', 'CADUCADO']
] // prettier-ignore

const permitida = (from: ProposalState, to: ProposalState): boolean =>
  VALIDAS.some(([f, t]) => f === from && t === to)

describe('canTransition', () => {
  it('acepta exactamente las transiciones de la maquina acordada', () => {
    for (const [from, to] of VALIDAS) {
      expect(canTransition(from, to), `${from} -> ${to}`).toBe(true)
    }
  })

  it('rechaza TODA transicion fuera de la maquina (matriz completa)', () => {
    for (const from of ESTADOS) {
      for (const to of ESTADOS) {
        expect(canTransition(from, to), `${from} -> ${to}`).toBe(permitida(from, to))
      }
    }
  })

  it('los terminales no salen: MERGEADO, RECHAZADO y CADUCADO son finales', () => {
    for (const terminal of ['MERGEADO', 'RECHAZADO', 'CADUCADO'] as const) {
      for (const to of ESTADOS) {
        expect(canTransition(terminal, to)).toBe(false)
      }
    }
  })

  it('no hay saltos: ELEGIDO no llega a GENERADO ni a MERGEADO directo', () => {
    expect(canTransition('ELEGIDO', 'GENERADO')).toBe(false)
    expect(canTransition('ELEGIDO', 'MERGEADO')).toBe(false)
    expect(canTransition('ANALIZADO', 'APROBADO')).toBe(false)
  })
})
