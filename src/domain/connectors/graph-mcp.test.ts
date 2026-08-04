import { describe, expect, it } from 'vitest'
import { GRAPH_SERVER, GRAPH_TOOL_RULE, withGraph } from './graph-mcp'
import { buildMcpConfig } from './mcp-config'

describe('withGraph', () => {
  it('mete el grafo aunque no haya conectores: nunca es opcional', () => {
    const cfg = JSON.parse(withGraph(null))
    expect(cfg.mcpServers[GRAPH_SERVER]).toEqual({
      command: 'npx',
      args: ['-y', 'codebase-memory-mcp']
    })
  })

  it('conserva los conectores y anade el grafo junto a ellos', () => {
    const connectors = buildMcpConfig([
      {
        id: 'figma',
        name: 'F',
        url: 'https://x/mcp',
        description: '',
        category: 'diseno',
        builtin: true,
        enabled: true
      }
    ])
    const cfg = JSON.parse(withGraph(connectors))
    expect(cfg.mcpServers.figma).toBeDefined()
    expect(cfg.mcpServers[GRAPH_SERVER]).toBeDefined()
  })

  it('la regla de herramienta abre TODO el servidor del grafo', () => {
    expect(GRAPH_TOOL_RULE).toBe('mcp__codebase-memory')
  })
})
