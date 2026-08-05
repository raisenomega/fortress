import { describe, expect, it } from 'vitest'
import type { CodeAgent, CodeAgentReply } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { AppContext } from '../context'
import { buildFeature, type BuildDeps } from './build-feature'

function reply(over: Partial<CodeAgentReply>): CodeAgentReply {
  return { text: 'listo', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [], ...over }
}
function agentOf(r: CodeAgentReply): CodeAgent {
  return { isAvailable: () => true, precheck: () => null, run: () => Promise.resolve(r) }
}
function ctx(trusted: boolean): AppContext {
  const project = { id: 'p1', name: 'P', path: '/tmp/p', trusted } as Project
  return { projects: { findById: () => project } } as unknown as AppContext
}
function deps(over: Partial<BuildDeps> = {}): BuildDeps & { reverted: string[] } {
  const reverted: string[] = []
  return {
    reverted,
    snapshot: () => 'ref1',
    revert: (r) => {
      reverted.push(r)
    },
    verify: () => Promise.resolve(true),
    ...over
  }
}

describe('buildFeature', () => {
  it('construye y NO revierte si todo pasa', async () => {
    const d = deps()
    const r = await buildFeature(ctx(true), 'p1', 'i', 'plan', agentOf(reply({})), d, () => {})
    expect(r.ok).toBe(true)
    expect(d.reverted).toHaveLength(0)
  })

  it('revierte si el agente falla', async () => {
    const d = deps()
    const r = await buildFeature(ctx(true), 'p1', 'i', 'p', agentOf(reply({ failed: true })), d, () => {})
    expect(r.ok).toBe(false)
    expect(d.reverted).toEqual(['ref1'])
  })

  it('revierte si la verificacion queda en rojo', async () => {
    const d = deps({ verify: () => Promise.resolve(false) })
    const r = await buildFeature(ctx(true), 'p1', 'i', 'p', agentOf(reply({})), d, () => {})
    expect(r.ok).toBe(false)
    expect(d.reverted).toEqual(['ref1'])
  })

  it('exige proyecto de confianza', async () => {
    expect((await buildFeature(ctx(false), 'p1', 'i', 'p', agentOf(reply({})), deps(), () => {})).ok).toBe(
      false
    )
  })

  it('exige repo git (snapshot no nulo)', async () => {
    const d = deps({ snapshot: () => null })
    expect((await buildFeature(ctx(true), 'p1', 'i', 'p', agentOf(reply({})), d, () => {})).ok).toBe(false)
  })
})
