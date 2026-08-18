import { describe, expect, it } from 'vitest'
import { detalleDeParada, type StopFacts } from './stop-detail'

const HECHOS: StopFacts = {
  spentSession: 4.5,
  costCap: 5,
  cyclesDone: 3,
  maxCycles: 3,
  maxConsecutiveDenials: 5,
  maxConsecutiveNoCandidates: 10
}

describe('detalleDeParada: la cifra que acompana al motivo', () => {
  it('el tope de gasto dice cuanto se gasto y cuanto habia', () => {
    expect(detalleDeParada('tope-gasto', HECHOS)).toBe('$4.50 de $5.00')
  })

  it('el tope de propuestas dice cuantas se cerraron', () => {
    expect(detalleDeParada('tope-ciclos', HECHOS)).toBe('3 de 3 propuestas cerradas')
  })

  it('los dos frenos de racha dicen su tope, que es la cifra con la que saltan', () => {
    expect(detalleDeParada('tope-denegaciones', HECHOS)).toBe('5 denegaciones seguidas de la politica') // prettier-ignore
    expect(detalleDeParada('pool-agotado', HECHOS)).toBe('10 vueltas seguidas sin candidato')
  })

  it('resuelto no necesita cifra del estado: su cifra es su definicion', () => {
    expect(detalleDeParada('resuelto', HECHOS)).toBe('tres escaneos 100/100 seguidos')
  })

  it('lo que explica otro no lleva cifra aqui', () => {
    // detenido lo explica el operador; error trae el mensaje de la excepcion.
    expect(detalleDeParada('detenido', HECHOS)).toBeNull()
    expect(detalleDeParada('error', HECHOS)).toBeNull()
  })
})
