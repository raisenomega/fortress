import { describe, expect, it } from 'vitest'
import type { Proposal } from '@domain/repair/proposal'
import { motivoDelArreglo } from '@domain/repair/motivo-del-arreglo'
import type { AppContext } from '../context'
import { candidates, elegirObjetivo } from './elegir-objetivo'
import { hallazgo } from './plan-repair-analyst-fake'

const rechazada = (huella: string): Proposal => ({
  id: 'prop-1', projectId: 'p1', findingId: 'f1', baseSha: 'viejo', state: 'RECHAZADO',
  analysisVerdict: 'REAL', analysisReason: motivoDelArreglo('src/infra/x.ts', huella), createdAt: 1, updatedAt: 1
}) // prettier-ignore

const banco = (huellaActual: string, previas: readonly Proposal[]): AppContext =>
  ({
    findings: { listMemory: () => [hallazgo('f1', 'src/api.ts')] },
    repairProposals: {
      findObsoleteFindingIds: () => [],
      findLiveFindingIds: () => [],
      listByProject: () => previas
    },
    fortressConfig: () => ({ kind: 'not-present' }),
    huellaDeConfig: () => huellaActual
  }) as unknown as AppContext

describe('la cola respeta la pausa por terreno; el dirigido no (ADR-102 §4)', () => {
  it('mismo terreno: el hallazgo no vuelve a la baraja aunque el HEAD sea otro', () => {
    const ids = candidates(banco('aaaa1111', [rechazada('aaaa1111')]), 'p1', 'nuevo', '/repo', 'completo') // prettier-ignore
    expect(ids.map((c) => c.id)).toEqual([])
  })

  it('cambia el terreno: vuelve a la baraja', () => {
    const ids = candidates(banco('bbbb2222', [rechazada('aaaa1111')]), 'p1', 'nuevo', '/repo', 'completo') // prettier-ignore
    expect(ids.map((c) => c.id)).toEqual(['f1'])
  })

  it('el camino dirigido se salta la pausa: quien lo pide a mano paga sabiendolo', () => {
    const sel = elegirObjetivo(banco('aaaa1111', [rechazada('aaaa1111')]), 'p1', 'nuevo', '/repo', 'completo', 'f1') // prettier-ignore
    expect(sel?.target.id).toBe('f1')
  })
})
