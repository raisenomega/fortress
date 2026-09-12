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

describe('la dedup de la Fase 4 sale GRATIS: el arco anterior paga aqui', () => {
  it('dos turnos con el mismo bloqueo en un proyecto: UNA fila, vistaEn 1', () => {
    const db = createMemoryDb()
    const ctx = banco(db)

    cerrar(ctx, ['Bash'])
    cerrar(ctx, ['Bash'])

    const [obs] = ctx.selfObservations.listOpen()
    expect(ctx.selfObservations.listOpen()).toHaveLength(1)
    expect(ctx.selfObservations.vistaEn(obs.id)).toBe(1)
  })

  it('el mismo bloqueo en DOS proyectos: una fila, vistaEn 2 — la senal', () => {
    // Es lo que los 6 turnos medidos en la base producirian: el mismo limite en
    // `fortress-command-center` y en `mailbd-main`, contado como dos evidencias.
    const db = createMemoryDb()
    const ctx = banco(db)
    db.prepare("INSERT INTO projects (id, name, path, created_at) VALUES ('p2','Otro','/tmp/o','2026')").run() // prettier-ignore

    cerrar(ctx, ['mcp__codebase-memory__search_graph'])
    cerrar(ctx, ['mcp__codebase-memory__search_graph'], { id: 'p2', name: 'Otro', path: '/tmp/o' } as Project) // prettier-ignore

    const [obs] = ctx.selfObservations.listOpen()
    expect(ctx.selfObservations.listOpen()).toHaveLength(1)
    expect(ctx.selfObservations.vistaEn(obs.id)).toBe(2)
    expect(obs.area).toBe('consulta-del-grafo')
  })
})
