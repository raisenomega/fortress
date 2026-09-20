import { describe, expect, it } from 'vitest'
import type { CodeAgent, CodeAgentRequest } from '@domain/chat/code-agent'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { buildAllowedTools } from '../../infrastructure/claude-code/build-allowed-tools'
import { claudeModeArg } from '@domain/settings/permission-mode'
import { PROJECT } from './chat-test-fixtures'
import { denialsNote } from './single-agent-outcome'
import { replyFromChat } from './reply-from-chat'

const noop = (): void => {}

/** El turno tal cual, con la peticion que salio al CLI a la vista. */
async function pedido(over: Record<string, unknown>): Promise<CodeAgentRequest> {
  const pedidos: CodeAgentRequest[] = []
  const cli: CodeAgent = {
    isAvailable: () => true,
    precheck: () => null,
    run: (p) => (pedidos.push(p), Promise.resolve({ text: 'ok', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] })) // prettier-ignore
  }
  // prettier-ignore
  await replyFromChat({ codeAgent: cli, project: PROJECT, corpus: EMPTY_CORPUS, prompt: 'resuelve el lote', mode: 'supervisado', excludedAgents: [], onStep: noop, onChunk: noop, known: ['HIGH a.ts:3 — t'], isCancelled: () => false, ...over } as never)
  return pedidos[0] as CodeAgentRequest
}

/**
 * BUG 2, el sintoma mas caro: el turno de plan derivaba `permission-mode plan`
 * de su `mode: 'supervisado'`, y `plan` BLOQUEA todo el MCP. El agente lo dijo
 * —«Grafo bloqueado en plan mode»— y la base lo guardo: las dos denegaciones de
 * aquel turno fueron `index_status` y `search_graph`. Planeo a ciegas por $5,02.
 */
describe('el turno de plan ve el grafo', () => {
  it('corre en lectura, no en plan', async () => {
    expect((await pedido({ deLote: true })).permissionMode).toBe('lectura')
  })

  it('y lectura es «default» para el CLI: ahi el MCP SI responde', () => {
    expect(claudeModeArg('lectura')).toBe('default')
    expect(claudeModeArg('plan')).toBe('plan')
  })

  it('PERO SIGUE SIN EDITAR: su allowlist no tiene Write, Edit ni Bash', () => {
    // El otro guardian de «no edita», y el que hace que esto sea seguro.
    const tools = buildAllowedTools('lectura', true, ['npm run build'])

    expect(tools.some((t) => /Write|Edit|Bash/.test(t))).toBe(false)
    expect(tools.some((t) => t.includes('codebase-memory'))).toBe(true)
  })

  it('un turno con FOCO no cambia: deriva de su modo, como siempre', async () => {
    expect((await pedido({ deLote: true, enFoco: 'bloque' })).permissionMode).toBe('plan')
  })
})

describe('el pie de pagina dice la verdad del turno', () => {
  it('en el turno de plan NO nombra «supervisado»', () => {
    // Decir «supervisado» en un proyecto autonomo fue el origen del bug.
    const nota = denialsNote('supervisado', ['mcp__codebase-memory__search_graph'], true)

    expect(nota).not.toContain('supervisado')
    expect(nota).toContain('turno de plan')
    expect(nota).toContain('solo lee')
  })

  it('en supervisado de verdad sigue diciendo lo de siempre', () => {
    expect(denialsNote('supervisado', ['Write'], false)).toContain('por el modo supervisado')
  })

  it('sin denegaciones no escribe nada, en ninguno de los dos', () => {
    expect(denialsNote('autonomo', [], true)).toBe('')
    expect(denialsNote('autonomo', [], false)).toBe('')
  })
})
