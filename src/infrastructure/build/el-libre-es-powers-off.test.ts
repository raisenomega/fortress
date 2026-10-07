import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { CodeAgent, CodeAgentRequest } from '@domain/chat/code-agent'
import type { CodeAgentReply } from '@domain/chat/code-agent-reply'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'

/** PASO 91, el LIMITE de seguridad pineado: el modo libre conversa en un
 *  cuarto vacio, en 'lectura' (sin Bash), sin confianza, sin proyecto y sin
 *  MCP — un chat libre jamas debe poder tocar un repo. */

const reply: CodeAgentReply = { text: 'claro, te cuento', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] } // prettier-ignore
let visto: CodeAgentRequest | null = null

vi.mock('electron', () => ({ app: { getPath: (): string => '/tmp/fake-userdata' } }))
vi.mock('./build-target', () => ({
  agentLibre: (): CodeAgent => ({
    isAvailable: (): boolean => true,
    precheck: (): null => null,
    run: (req: CodeAgentRequest, onChunk: (d: string) => void): Promise<CodeAgentReply> => {
      visto = req
      onChunk('en vivo')
      return Promise.resolve(reply)
    }
  })
}))

const { runLibre } = await import('./run-libre')

describe('el modo libre es powers-off de verdad', () => {
  it('cuarto vacio, lectura, sin confianza, SIN proyecto, opus — y streamea', async () => {
    const trozos: string[] = []
    const r = await runLibre({} as AppContext, 'hola', [], (d) => trozos.push(d))
    expect(r.ok).toBe(true)
    const req = visto as CodeAgentRequest | null
    expect(req?.projectPath.endsWith('chat-libre')).toBe(true)
    expect(req?.permissionMode).toBe('lectura')
    expect(req?.trusted).toBe(false)
    expect(req !== null && 'projectId' in req).toBe(false)
    expect(req?.model).toBe('opus')
    expect(trozos).toEqual(['en vivo'])
  })
})
