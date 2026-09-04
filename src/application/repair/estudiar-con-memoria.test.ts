import { describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import type { Candidate, Selection } from '@domain/repair/select-target'
import type { SelfObservation } from '@domain/system/self-observation'
import type { AppContext } from '../context'
import { estudiar } from './estudiar-con-memoria'

// prettier-ignore
const TARGET: Candidate = { id: 'f1', severity: 'LOW', title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z' }
const SEL: Selection = { target: TARGET, reason: 'r' }
const PROJECT = { id: 'p1', path: '/tmp/p', name: 'p' } as Project

// prettier-ignore
const cerrada = (over: Partial<SelfObservation>): SelfObservation => ({
  id: 'o1', sourceProject: 'p', kind: 'gap', area: 'grafo', note: 'n', status: 'atendido',
  reason: null, attendedBy: 'x', attendedAt: '2026-09-01', createdAt: '2026-08-01', ...over
})

/** Contexto de mentira que APUNTA lo que recibio el analista por el puerto. */
function banco(cerradas: readonly SelfObservation[]): {
  readonly ctx: AppContext
  readonly recibido: () => readonly string[] | null
} {
  let recibido: readonly string[] | null = null
  const ctx = {
    selfObservations: { listClosed: () => cerradas },
    analystFor: () => ({
      study: (_t: Candidate, atendidas: readonly string[]) => {
        recibido = atendidas
        return Promise.resolve({ analysis: {}, runMeta: {} })
      }
    })
  } as unknown as AppContext
  return { ctx, recibido: () => recibido }
}

describe('el analista recibe la memoria, y la recibe formateada', () => {
  it('lo cerrado llega al puerto como texto listo, no como filas', async () => {
    const b = banco([cerrada({ area: 'grafo', note: 'auto-indexa sin permiso' })])
    await estudiar(b.ctx, PROJECT, SEL)

    expect(b.recibido()).toEqual(['grafo — auto-indexa sin permiso'])
  })

  it('el descarte llega con su motivo: sin el, el analista lo reabre', async () => {
    const b = banco([cerrada({ status: 'descartado', reason: 'no aplica' })])
    await estudiar(b.ctx, PROJECT, SEL)

    expect(b.recibido()).toEqual(['grafo — n (descartado: no aplica)'])
  })

  it('sin cerradas pasa una lista vacia, y el prompt no pondra seccion', async () => {
    const b = banco([])
    await estudiar(b.ctx, PROJECT, SEL)

    expect(b.recibido()).toEqual([])
  })
})
