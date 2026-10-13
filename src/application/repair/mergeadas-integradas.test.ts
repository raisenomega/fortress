import { describe, expect, it } from 'vitest'
import type { Proposal } from '@domain/repair/proposal'
import { mergeadasIntegradas } from './mergeadas-integradas'

type Ctx = Parameters<typeof mergeadasIntegradas>[0]

const prop = (id: string, state: Proposal['state']): Proposal => ({ id, state }) as Proposal
const genEvent = (sha: string): { evidenceJson: string } => ({ evidenceJson: JSON.stringify({ commitSha: sha }) }) // prettier-ignore

function ctxFake(shaPorId: Record<string, string>, enHead: Set<string>): Ctx {
  return {
    eventLog: { list: (id: string) => Promise.resolve([genEvent(shaPorId[id] ?? '')]) },
    esAncestro: (_repo: string, sha: string) => enHead.has(sha)
  } as unknown as Parameters<typeof mergeadasIntegradas>[0]
}

describe('mergeadasIntegradas: solo cuenta lo que GIT confirma, no el estado (INC-D / MERGEADO)', () => {
  it('un MERGEADO cuyo commit git NO ve (huerfano, como 5214cc9) NO cuenta; el que SI, cuenta', async () => {
    const suyas = [prop('a', 'MERGEADO'), prop('b', 'MERGEADO'), prop('c', 'RECHAZADO')]
    // a: su commit esta en HEAD -> integrado. b: huerfano -> NO. c: ni MERGEADO.
    const ctx = ctxFake({ a: 'enmain', b: 'huerfano', c: 'x' }, new Set(['enmain']))

    // Revertir a contar por estado daria 2: el mutante muere aqui.
    expect(await mergeadasIntegradas(ctx, '/repo', suyas)).toBe(1)
  })

  it('MERGEADO sin commit en sus eventos: sesgo seguro, no cuenta', async () => {
    const ctx = ctxFake({ a: '' }, new Set())

    expect(await mergeadasIntegradas(ctx, '/repo', [prop('a', 'MERGEADO')])).toBe(0)
  })
})
