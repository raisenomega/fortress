import { describe, expect, it } from 'vitest'
import { advanceProposal } from './advance-proposal'
import { bancoDelAvance } from './advance-proposal-fixture'

const RAZON = 'integracion firmada por el operador — arbol integrado medido (typecheck, lint)'
const CURSOR = { last: 0 } as never

describe('el fix que ENTRA marca su hallazgo (ADR-087)', () => {
  it('MERGEADO MARCA: el hallazgo pasa a mitigado, con como entro escrito', async () => {
    // Hasta aqui integrar no tocaba la fila: el motor proponia, OMEGA revisaba,
    // el operador firmaba, el merge entraba — y el hallazgo seguia ACTIVE,
    // contando para el score y pidiendole trabajo al motor otra vez.
    const b = bancoDelAvance({ state: 'APROBADO' })

    await advanceProposal(b.context, b.proposal, ['MERGEADO'], RAZON, CURSOR, 1757000000000)

    expect(b.marcas).toEqual([
      { id: 'f-1', note: `el motor integro su fix: ${RAZON}`, at: expect.any(String) }
    ])
  })

  it('SOLO EN MERGEADO: caducar no marca nada', async () => {
    // Una propuesta que muere no arreglo nada. Marcar ahi diria que hay un fix
    // aplicado donde no lo hay, que es el falso negativo por la puerta de atras.
    const b = bancoDelAvance({ state: 'OMEGA' })

    await advanceProposal(b.context, b.proposal, ['CADUCADO'], 'base movida', CURSOR, 1)

    expect(b.patches.map((p) => p.state)).toEqual(['CADUCADO'])
    expect(b.marcas).toHaveLength(0)
  })

  it('y en un camino de dos saltos marca UNA vez, al llegar', async () => {
    const b = bancoDelAvance({ state: 'OMEGA' })

    await advanceProposal(b.context, b.proposal, ['APROBADO', 'MERGEADO'], RAZON, CURSOR, 1)

    expect(b.patches.map((p) => p.state)).toEqual(['APROBADO', 'MERGEADO'])
    expect(b.marcas).toHaveLength(1)
  })

  it('un salto ILEGAL no marca: no se llego a integrar nada', async () => {
    const b = bancoDelAvance({ state: 'ELEGIDO' })

    await advanceProposal(b.context, b.proposal, ['MERGEADO'], RAZON, CURSOR, 1)

    expect(b.patches).toHaveLength(0)
    expect(b.marcas).toHaveLength(0)
  })
})
