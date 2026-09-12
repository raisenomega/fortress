import { describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import { finishTurn } from '@application/chat/finish-turn'
import type { ReplyOutcome } from '@application/chat/reply-outcome'
import type { Project } from '@domain/project/project'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'
import type { Db } from './database'

const PROYECTO = { id: 'p1', name: 'Cliente ACME', path: '/media/disco/ACME' } as Project

const turno = (deniedTools: readonly string[]): ReplyOutcome => ({
  text: 'hecho',
  failed: false,
  usage: EMPTY_USAGE,
  tools: [],
  edits: [],
  agents: [],
  runs: [],
  findings: [],
  deniedTools
})

function banco(db: Db): AppContext {
  seedProject(db, 'p1')
  return {
    projects: { findById: () => PROYECTO },
    selfObservations: createSqliteSelfObservationRepository(db),
    chat: { add: (m: unknown) => ({ ...(m as object), id: 'x' }) },
    runs: { record: () => undefined },
    activity: { recordMany: () => undefined },
    transaction: (fn: () => unknown) => fn()
  } as unknown as AppContext
}

const cerrar = (ctx: AppContext, tools: readonly string[], project = PROYECTO): void => {
  finishTurn({
    context: ctx, project, meta: { mode: 'autonomo', engine: 'claude-code' },
    outcome: turno(tools), aviso: '', startedAt: 0, prompt: 'p'
  }) // prettier-ignore
}

describe('el chat observa de sus DENIALS, sin spawn ni bloque en el stream', () => {
  it('un Bash denegado deja UNA observacion, con su clase', () => {
    const db = createMemoryDb()
    const ctx = banco(db)

    cerrar(ctx, ['Bash'])

    expect(ctx.selfObservations.listOpen()).toMatchObject([
      { kind: 'limitacion', area: 'permisos-de-herramienta' }
    ])
  })

  it('sin bloqueos NO asienta nada: el turno normal no ensucia el backlog', () => {
    const db = createMemoryDb()
    const ctx = banco(db)

    cerrar(ctx, [])

    expect(ctx.selfObservations.listOpen()).toEqual([])
  })

  it('y la nota NO lleva codigo del cliente, ni siquiera su ruta', () => {
    const db = createMemoryDb()
    const ctx = banco(db)

    cerrar(ctx, ['Bash'])

    const [obs] = ctx.selfObservations.listOpen()
    expect(obs.note).not.toContain('/media/disco/ACME')
    expect(obs.note).toContain('FORTRESS le nego la herramienta Bash')
  })
})
