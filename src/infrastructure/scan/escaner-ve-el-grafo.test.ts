import { describe, expect, it } from 'vitest'
import type { CodeAgent, CodeAgentRequest } from '@domain/chat/code-agent'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { claudeModeArg } from '@domain/settings/permission-mode'
import { buildAllowedTools } from '../claude-code/build-allowed-tools'
import { escanear } from './una-pasada'

const SCRIPTS = ['typecheck', 'lint', 'test']

/** El escaneo con la peticion que salio al CLI a la vista. */
async function pedido(): Promise<CodeAgentRequest> {
  const pedidos: CodeAgentRequest[] = []
  const cli: CodeAgent = {
    isAvailable: () => true,
    precheck: () => null,
    run: (p) => (pedidos.push(p), Promise.resolve({ text: 'sin hallazgos', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] })) // prettier-ignore
  }
  // prettier-ignore
  await escanear(cli, () => undefined, { projectId: 'p1', projectPath: '/proyecto' } as never, () => undefined)
  return pedidos[0] as CodeAgentRequest
}

/**
 * La señal nº1 del backlog: `plan` BLOQUEA todo el MCP. El recibo de la
 * auditoria del 18-sep lo dimensiona — de 353 llamadas, 241 fueron Bash, 99
 * Read, y las 6 al grafo (`list_projects` ×5, `search_graph` ×1) se comieron un
 * «Cannot call … while in plan mode». El escaner auditaba 2081 ficheros a
 * ciegas, y es el producto.
 */
describe('el escaner ve el grafo', () => {
  it('corre en auditoria, no en plan', async () => {
    expect((await pedido()).permissionMode).toBe('auditoria')
  })

  it('y auditoria es «default» para el CLI: ahi el MCP SI responde', () => {
    expect(claudeModeArg('auditoria')).toBe('default')
    expect(claudeModeArg('plan')).toBe('plan')
  })

  it('conserva las tres familias que usa: grafo, lectura y Bash', () => {
    const tools = buildAllowedTools('auditoria', false, SCRIPTS)

    expect(tools.some((t) => t.includes('search_graph'))).toBe(true)
    expect(tools).toContain('Read')
    expect(tools).toContain('Bash')
  })

  it('el Bash va ENTERO, sin lista de comandos', () => {
    // 241 llamadas exploratorias no se enumeran de antemano: acotarlas seria
    // decidir que puede mirar una auditoria (ADR-090 §0).
    const tools = buildAllowedTools('auditoria', false, SCRIPTS)

    expect(tools).toContain('Bash')
    expect(tools.some((t) => t.startsWith('Bash('))).toBe(false)
  })
})

describe('auditar es MIRAR: el escaner no edita', () => {
  it('sin Write ni Edit, con confianza o sin ella', () => {
    for (const trusted of [true, false]) {
      const tools = buildAllowedTools('auditoria', trusted, SCRIPTS)
      expect(tools.some((t) => /Write|Edit/.test(t))).toBe(false)
    }
  })

  it('y sigue sin autoverificarse: `trusted: false` en la peticion', async () => {
    expect((await pedido()).trusted).toBe(false)
  })
})
