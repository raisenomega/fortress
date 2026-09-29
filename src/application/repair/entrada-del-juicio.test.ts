import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import { MOTIVO_CORREA } from '@domain/repair/lo-que-el-motor-supo'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { AppContext } from '../context'
import { entradaDelJuicio } from './entrada-del-juicio'

const ev = (over: Partial<ProposalEvent>): ProposalEvent => ({
  id: 'e1',
  proposalId: 'p1',
  seq: 1,
  phase: 'GENERATE',
  eventType: 'DECISION',
  actor: 'motor',
  ts: 1,
  ...over
})

const CORREA = ev({
  reason: MOTIVO_CORREA,
  evidenceJson: JSON.stringify({ allowed: ['api/x.ts'], allows: ['src/nuevo/**'] })
})

function banco(libro: readonly ProposalEvent[]): { ctx: AppContext; pedidos: string[] } {
  const pedidos: string[] = []
  const ctx = {
    corpus: { of: () => EMPTY_CORPUS },
    eventLog: {
      list: (id: string) => (pedidos.push(id), Promise.resolve(libro)),
      record: () => Promise.resolve()
    }
  } as unknown as AppContext
  return { ctx, pedidos }
}

const plan = { target: { title: 't', file: 'api/x.ts', line: 4 } } as never
const propuesta = { id: 'p1', baseSha: 'abc123' } as never

describe('la entrada del juicio LEE el libro de SU propuesta', () => {
  it('pide los eventos por el id de la propuesta, y no otro', async () => {
    // El mutante que esto mata: pasarle una lista vacia al revisor. Sin este
    // test, quitar la lectura del libro no rompia nada.
    const b = banco([CORREA])

    await entradaDelJuicio(b.ctx, propuesta, plan, '/tmp/wt')

    expect(b.pedidos).toEqual(['p1'])
  })

  it('y la correa asentada llega en la entrada, no recalculada', async () => {
    const b = banco([CORREA])

    const e = await entradaDelJuicio(b.ctx, propuesta, plan, '/tmp/wt')

    expect(e.motorSupo?.join('\n')).toContain('api/x.ts')
    expect(e.motorSupo?.join('\n')).toContain('src/nuevo/**')
  })

  it('con el libro vacio dice que no hay nada registrado', async () => {
    const e = await entradaDelJuicio(banco([]).ctx, propuesta, plan, '/tmp/wt')

    expect(e.motorSupo?.join('\n')).toContain('sin correa registrada')
  })
})
