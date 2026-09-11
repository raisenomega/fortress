import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryDb } from './memory-db'
import { createSqliteAgentRunRepository } from './sqlite-agent-run-repository'
import type { AgentRunRepository } from '@domain/telemetry/agent-run-repository'
import type { RunKind } from '@domain/telemetry/agent-run'
import type { Db } from './database'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'

const PROYECTO = 'p1'
let db: Db
let runs: AgentRunRepository

const asentar = (kind: RunKind, agentId: string | null): void => {
  runs.record({
    projectId: PROYECTO,
    agentId: agentId as never,
    kind,
    durationMs: 1000,
    failed: false,
    usage: { ...EMPTY_USAGE, outputTokens: 100, costUsd: 1 },
    tools: []
  })
}

beforeEach(() => {
  db = createMemoryDb()
  db.prepare(
    'INSERT INTO projects (id, name, path, stack, fortress_score, created_at) VALUES (?, ?, ?, ?, 0, ?)'
  ) // prettier-ignore
    .run(PROYECTO, 'P', '/tmp/p', 'node', '2026-09-11')
  runs = createSqliteAgentRunRepository(db)
})

describe('el kind sistema se guarda y se distingue', () => {
  it('la tabla lo acepta: el CHECK se amplio', () => {
    expect(() => asentar('sistema', 'scope-classifier')).not.toThrow()

    const fila = db.prepare("SELECT kind FROM agent_runs WHERE agent_id = 'scope-classifier'").get()
    expect(fila).toEqual({ kind: 'sistema' })
  })

  it('se puede contar aparte de las de chat', () => {
    asentar('chat', 'code-reviewer')
    asentar('sistema', 'scope-classifier')
    asentar('sistema', 'scope-classifier')

    const porKind = db.prepare('SELECT kind, COUNT(*) n FROM agent_runs GROUP BY kind').all()
    expect(porKind).toEqual([
      { kind: 'chat', n: 1 },
      { kind: 'sistema', n: 2 }
    ])
  })
})

describe('lo que de verdad protege al escaner: `totalsFor` va por AGENTE', () => {
  it('las corridas del juez no entran en las del Security Reviewer', () => {
    asentar('scan', 'security-reviewer')
    asentar('sistema', 'scope-classifier')
    asentar('sistema', 'scope-classifier')

    // El score de OMEGA sobre el escaner sale de `totalsFor(SCANNER)`. El juez
    // es OTRO agente, asi que sus corridas no mueven ni el compliance ni el
    // `tokensPerRun` del escaner por mucho que se asienten.
    expect(runs.totalsFor('security-reviewer', PROYECTO).runs).toBe(1)
    expect(runs.totalsFor('scope-classifier', PROYECTO).runs).toBe(2)
  })
})
