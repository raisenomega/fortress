import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { CodeAgent, CodeAgentRequest } from '@domain/chat/code-agent'
import type { CodeAgentReply } from '@domain/chat/code-agent-reply'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { ok } from '@domain/shared/result'

/** PASO 82: el Ejecutor era el ultimo MUDO con pantalla delante — buildFeature
 *  ya aceptaba onChunk y run-build.ts le enchufaba `() => {}`. */

const proyecto = { id: 'p1', name: 'P', path: '/tmp/p', trusted: true }
const reply: CodeAgentReply = { text: 'no pude', failed: true, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] } // prettier-ignore

vi.mock('./build-target', () => ({
  resolveEditTarget: (): unknown => ok(proyecto),
  agentFor: (): CodeAgent => ({
    isAvailable: (): boolean => true,
    precheck: (): null => null,
    run: (_req: CodeAgentRequest, onChunk: (d: string) => void): Promise<CodeAgentReply> => {
      onChunk('edita ')
      onChunk('en vivo')
      return Promise.resolve(reply)
    }
  })
}))
vi.mock('../barrera-guard', () => ({ guardBarrera: (): null => null }))
vi.mock('../git/git-snapshot', () => ({ gitSnapshot: (): string => 'ref0', gitRevert: (): void => {} })) // prettier-ignore

const { runBuild } = await import('./run-build')

describe('el Ejecutor reenvia sus trozos en vez de tirarlos', () => {
  it('cada trozo llega al oyente aunque el build acabe revirtiendo: lo vivo se vio', async () => {
    const trozos: string[] = []
    const ctx = { projects: { findById: (): unknown => proyecto }, chat: { add: (m: unknown): unknown => m } } as unknown as AppContext // prettier-ignore
    await runBuild(ctx, 'p1', 'arregla x', 'el plan aprobado', (d) => trozos.push(d))
    expect(trozos).toEqual(['edita ', 'en vivo'])
  })
})
