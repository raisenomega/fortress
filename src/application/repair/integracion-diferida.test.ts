import { describe, expect, it } from 'vitest'
import { autoMergeProposal } from './auto-merge-proposal'
import { banco } from './auto-merge-fixture'
import { OCUPADO } from './carril-del-merge'

const integrar = (opts = {}): ReturnType<typeof autoMergeProposal> => {
  const b = banco(opts)
  return autoMergeProposal(b.context, b.deps, { proposalId: 'prop-1' })
}
const conBanco = (opts = {}): ReturnType<typeof banco> => banco(opts)

describe('el turno ocupado DIFIERE la integracion; no la mata', () => {
  it('no se toca el arbol: ni un git merge', async () => {
    const b = conBanco({ carrilOcupado: true })
    await autoMergeProposal(b.context, b.deps, { proposalId: 'prop-1' })

    expect(b.aplicados).toEqual([])
  })

  it('la propuesta NO se caduca: queda esperando la firma', async () => {
    // Caducarla mataria un fix bueno porque el operador estaba firmando otro.
    const b = conBanco({ carrilOcupado: true })
    await autoMergeProposal(b.context, b.deps, { proposalId: 'prop-1' })

    expect(b.patches.map((p) => p.state)).not.toContain('CADUCADO')
  })

  it('lo dice con su propia razon, distinta de un merge fallido', async () => {
    expect(await integrar({ carrilOcupado: true })).toMatchObject({
      applied: false,
      reason: OCUPADO
    })
  })
})

describe('y con el turno libre todo sigue como estaba', () => {
  it('integra', async () => {
    expect(await integrar()).toMatchObject({ applied: true })
  })

  it('un merge que falla DE VERDAD sigue caducando', async () => {
    // El camino de error de siempre, intacto: un conflicto si mata la rama.
    const b = conBanco({ outcome: { ok: false, kind: 'conflict', gitOutput: 'CONFLICT' } })
    await autoMergeProposal(b.context, b.deps, { proposalId: 'prop-1' })

    expect(b.patches.map((p) => p.state)).toContain('CADUCADO')
  })
})
