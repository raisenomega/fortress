import { describe, expect, it } from 'vitest'
import type { ProposalState } from './proposal'
import { canTransition } from './maquina-de-estados'

const ESTADOS: readonly ProposalState[] = [
  'ELEGIDO', 'ANALIZADO', 'GENERADO', 'GATE', 'OMEGA',
  'APROBADO', 'RECHAZADO', 'MERGEADO', 'CADUCADO'
] // prettier-ignore

/** La maquina acordada, entera: lo que no esta aqui debe rechazarse. */
const VALIDAS: ReadonlyArray<readonly [ProposalState, ProposalState]> = [
  ['ELEGIDO', 'ANALIZADO'], ['ELEGIDO', 'RECHAZADO'], ['ELEGIDO', 'CADUCADO'],
  ['ANALIZADO', 'GENERADO'], ['ANALIZADO', 'RECHAZADO'], ['ANALIZADO', 'CADUCADO'],
  ['GENERADO', 'GATE'], ['GENERADO', 'RECHAZADO'], ['GENERADO', 'CADUCADO'],
  // ADR-115 B2: la vuelta tras un rojo de codigo con el rechazo aplazado.
  ['GENERADO', 'GENERADO'],
  ['GATE', 'OMEGA'], ['GATE', 'RECHAZADO'], ['GATE', 'CADUCADO'],
  ['OMEGA', 'APROBADO'], ['OMEGA', 'RECHAZADO'], ['OMEGA', 'CADUCADO'],
  // La arista del LAZO (ADR-110 §3): un PARCIAL aprobado vuelve al generador.
  ['OMEGA', 'GENERADO'],
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

  it('el lazo tiene su arista, y es la UNICA que vuelve atras (ADR-110)', () => {
    expect(canTransition('OMEGA', 'GENERADO')).toBe(true)
    // Y no abre las demas: la vuelta entra por el generador, no por el gate ni
    // por el analisis. El freno NO vive en la tabla, vive en el lazo.
    expect(canTransition('OMEGA', 'GATE')).toBe(false)
    expect(canTransition('OMEGA', 'ANALIZADO')).toBe(false)
    expect(canTransition('GATE', 'GENERADO')).toBe(false)
    expect(canTransition('APROBADO', 'GENERADO')).toBe(false)
  })

  it('no hay saltos: ELEGIDO no llega a GENERADO ni a MERGEADO directo', () => {
    expect(canTransition('ELEGIDO', 'GENERADO')).toBe(false)
    expect(canTransition('ELEGIDO', 'MERGEADO')).toBe(false)
    expect(canTransition('ANALIZADO', 'APROBADO')).toBe(false)
  })
})
