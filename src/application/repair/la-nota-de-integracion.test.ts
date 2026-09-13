import { describe, expect, it } from 'vitest'
import { advanceProposal } from './advance-proposal'
import { bancoDelAvance } from './advance-proposal-fixture'

const RAZON = 'integracion firmada por el operador — arbol integrado medido (typecheck, lint)'
const CURSOR = { last: 0 } as never

describe('lo que la nota del motor dice, y lo que no', () => {
  it('y la nota dice QUIEN lo hizo, que una marca del operador empieza por su sha', async () => {
    const b = bancoDelAvance({ state: 'APROBADO' })

    await advanceProposal(b.context, b.proposal, ['MERGEADO'], RAZON, CURSOR, 1)

    expect(b.marcas[0].note).toContain('el motor integro su fix')
    // El sha NO viaja: vive en `merge_decisions`, una sola fuente.
    expect(b.marcas[0].note).not.toMatch(/\b[0-9a-f]{7,40}\b/)
  })
})
