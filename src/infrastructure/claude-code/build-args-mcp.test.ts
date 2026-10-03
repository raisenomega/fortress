import { describe, expect, it } from 'vitest'
import { buildArgs } from './claude-cli'

const AGENTS = { 'security-reviewer': { description: 'Audita', prompt: 'Eres el auditor' } }

/**
 * buildArgs es la ruta por la que corren TODOS los agentes. El grafo del
 * proyecto viaja en --mcp-config en CADA spawn: consultarlo es no negociable.
 * Los conectores se suman encima; nunca lo desplazan.
 */
function mcpOf(built: readonly string[]): { mcpServers: Record<string, unknown> } {
  return JSON.parse(built[built.indexOf('--mcp-config') + 1])
}

describe('buildArgs con MCP', () => {
  it('el grafo viaja SIEMPRE, con o sin conectores', () => {
    const cfg = mcpOf(buildArgs('hola', 'plan', AGENTS, null, 3).args)
    expect(cfg.mcpServers['codebase-memory']).toBeDefined()
  })

  it('sin conectores, la config MCP es solo el grafo', () => {
    const cfg = mcpOf(buildArgs('hola', 'plan', AGENTS, null, 3, null).args)
    expect(Object.keys(cfg.mcpServers)).toEqual(['codebase-memory'])
  })

  it('el grafo se permite en --allowedTools: sin la regla el MCP se auto-deniega', () => {
    expect(buildArgs('hola', 'plan', AGENTS, null, 3).args).toContain(
      'mcp__codebase-memory__search_graph'
    )
  })

  it('con conectores, se suman al grafo sin desplazarlo', () => {
    const conMcp = buildArgs(
      'hola',
      'plan',
      AGENTS,
      'security-reviewer',
      3,
      '{"mcpServers":{"figma":{"type":"http","url":"https://x/mcp"}}}'
    )
    const cfg = mcpOf(conMcp.args)
    expect(cfg.mcpServers.figma).toBeDefined()
    expect(cfg.mcpServers['codebase-memory']).toBeDefined()
  })
})
