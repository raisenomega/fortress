import { describe, expect, it } from 'vitest'
import { canTransition, isTerminal, TERMINAL_STATES, type ProposalState } from './proposal'

/**
 * La terminalidad se DERIVA de la tabla de transiciones (ADR-059): no hay una
 * segunda lista que mantener a mano y que pueda envejecer por su cuenta.
 */
describe('isTerminal / TERMINAL_STATES', () => {
  const ESTADOS: readonly ProposalState[] = [
    'ELEGIDO', 'ANALIZADO', 'GENERADO', 'GATE', 'OMEGA',
    'APROBADO', 'RECHAZADO', 'MERGEADO', 'CADUCADO'
  ] // prettier-ignore

  it('los terminales son exactamente MERGEADO, RECHAZADO y CADUCADO', () => {
    expect([...TERMINAL_STATES].sort()).toEqual(['CADUCADO', 'MERGEADO', 'RECHAZADO'])
  })

  it('terminal equivale a no tener ninguna transicion de salida', () => {
    for (const estado of ESTADOS) {
      const tieneSalida = ESTADOS.some((destino) => canTransition(estado, destino))
      expect(isTerminal(estado)).toBe(!tieneSalida)
    }
  })

  it('los vivos no son terminales: de ELEGIDO a APROBADO todos siguen abiertos', () => {
    const vivos = ESTADOS.filter((e) => !TERMINAL_STATES.includes(e))
    expect(vivos).toHaveLength(6)
    for (const estado of vivos) expect(isTerminal(estado)).toBe(false)
  })
})
