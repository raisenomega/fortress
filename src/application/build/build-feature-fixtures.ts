import type { CodeAgent, CodeAgentReply } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { AppContext } from '../context'
import type { BuildDeps } from './build-feature'

export function reply(over: Partial<CodeAgentReply>): CodeAgentReply {
  return {
    text: 'listo',
    failed: false,
    denials: [],
    usage: EMPTY_USAGE,
    tools: [],
    edits: [],
    ...over
  }
}

export function agentOf(r: CodeAgentReply): CodeAgent {
  return { isAvailable: () => true, precheck: () => null, run: () => Promise.resolve(r) }
}

export function ctx(trusted: boolean): AppContext {
  const project = { id: 'p1', name: 'P', path: '/tmp/p', trusted } as Project
  return { projects: { findById: () => project } } as unknown as AppContext
}

export function deps(over: Partial<BuildDeps> = {}): BuildDeps & { reverted: string[] } {
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
