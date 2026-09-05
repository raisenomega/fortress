import { describe, expect, it } from 'vitest'
import { GRAPH_SERVER, GRAPH_INDEX_TOOL, withGraph } from './graph-mcp'
import { buildMcpConfig } from './mcp-config'

describe('withGraph', () => {
  it('mete el grafo (binario instalado, no npx) aunque no haya conectores', () => {
    const cfg = JSON.parse(withGraph(null))
    expect(cfg.mcpServers[GRAPH_SERVER]).toEqual({
      type: 'stdio',
      command: 'codebase-memory-mcp',
      args: []
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

  it('respeta un codebase-memory ya definido: el del proyecto gana al sintetizado', () => {
    const propio = JSON.stringify({
      mcpServers: { [GRAPH_SERVER]: { command: 'node', args: ['graph-server.js'] } }
    })
    const cfg = JSON.parse(withGraph(propio))
    expect(cfg.mcpServers[GRAPH_SERVER]).toEqual({ command: 'node', args: ['graph-server.js'] })
  })

  it('la regla de herramienta abre TODO el servidor del grafo', () => {
    expect(GRAPH_INDEX_TOOL).toBe('mcp__codebase-memory__index_repository')
  })
})
