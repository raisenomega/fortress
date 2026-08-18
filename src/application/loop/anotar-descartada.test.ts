import { describe, expect, it } from 'vitest'
import type { ChainOutcome } from '../repair/motor-chain-outcome'
import { anotarDescartada } from './loop-counters'
import { freshProgress } from './loop-progress'

const descartada: ChainOutcome = { kind: 'descartada', proposalId: 'p', motivo: 'gate_failed' }
const integrada: ChainOutcome = { kind: 'integrada', proposalId: 'p' }
const esperaFirma: ChainOutcome = { kind: 'espera-firma', proposalId: 'p', condition: null }

/** Cuenta la racha tras la secuencia de vueltas dada. */
function racha(...vueltas: readonly ChainOutcome[]): number {
  const p = freshProgress()
  for (const vuelta of vueltas) anotarDescartada(p, vuelta)
  return p.consecutiveDiscarded
}

describe('la racha de no-avance', () => {
  it('cada fix que muere la suma', () => {
    expect(racha(descartada, descartada, descartada)).toBe(3)
  })

  it('una integracion la borra: eso SI es avanzar', () => {
    expect(racha(descartada, descartada, integrada, descartada, descartada)).toBe(2)
  })

  it('una propuesta esperando firma tambien la borra', () => {
    // No se integro, pero existe y es del operador: el motor hizo su trabajo.
    expect(racha(descartada, descartada, esperaFirma)).toBe(0)
  })

  it('una vuelta sin candidato no la toca: no hubo fix que muriera', () => {
    // Esa la cuenta pool-agotado, que es otro freno y otra pregunta.
    expect(racha(descartada, { kind: 'sin-candidato' }, descartada)).toBe(2)
  })

  it('un hallazgo que resulto obsoleto tampoco: nadie fallo ahi', () => {
    expect(racha(descartada, { kind: 'obsoleto', proposalId: 'p' })).toBe(1)
  })
})
