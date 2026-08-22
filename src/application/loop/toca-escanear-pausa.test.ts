import { describe, expect, it } from 'vitest'
import type { ChainOutcome } from '../repair/motor-chain-outcome'
import { tocaEscanear } from './loop-counters'
import { freshProgress } from './loop-progress'

const esperaOmega: ChainOutcome = { kind: 'espera-omega', proposalId: 'p' }
const integrada: ChainOutcome = { kind: 'integrada', proposalId: 'p' }

describe('la cadencia de re-escaneo cuenta integraciones, no trabajo', () => {
  it('una parada en el gate NO acerca el re-escaneo: el arbol no cambio', () => {
    // Decision explicita, no herencia: un fix parado en su worktree deja este
    // arbol identico, y volver a medirlo daria el mismo score pagandolo.
    const p = freshProgress()
    for (let i = 0; i < 5; i += 1) expect(tocaEscanear(p, esperaOmega, 1)).toBe(false)
  })

  it('una integracion si lo acerca, como siempre', () => {
    expect(tocaEscanear(freshProgress(), integrada, 1)).toBe(true)
  })

  it('las paradas en el gate no borran lo que las integraciones acumularon', () => {
    const p = freshProgress()
    tocaEscanear(p, integrada, 2)
    tocaEscanear(p, esperaOmega, 2)
    expect(tocaEscanear(p, integrada, 2)).toBe(true)
  })
})
