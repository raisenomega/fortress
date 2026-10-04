import { describe, expect, it } from 'vitest'
import type { ConnectorState } from './connector'
import { buildMcpConfig, mergeMcpConfig } from './mcp-config'

function state(over: Partial<ConnectorState>): ConnectorState {
  return {
    id: 'figma',
    name: 'Figma',
    url: 'https://mcp.figma.com/mcp',
    description: '',
    category: 'diseno',
    builtin: true,
    enabled: true,
    ...over
  }
}

describe('buildMcpConfig', () => {
  it('sin conectores activos devuelve null para poder omitir el flag', () => {
    expect(buildMcpConfig([])).toBeNull()
    expect(buildMcpConfig([state({ enabled: false })])).toBeNull()
  })

  it('deja fuera los que no tienen endpoint', () => {
    expect(buildMcpConfig([state({ id: 'github', url: '' })])).toBeNull()
  })

  it('serializa los activos bajo mcpServers', () => {
    const json = buildMcpConfig([state({}), state({ id: 'github', url: '' })])
    expect(JSON.parse(json ?? '{}')).toEqual({
      mcpServers: { figma: { type: 'http', url: 'https://mcp.figma.com/mcp' } }
    })
  })
})

describe('mergeMcpConfig', () => {
  const project = { 'codebase-memory': { command: 'node', args: ['g.js'] } }

  it('sin servidores del proyecto, devuelve el base intacto', () => {
    expect(mergeMcpConfig(null, null)).toBeNull()
    expect(mergeMcpConfig('{"mcpServers":{}}', {})).toBe('{"mcpServers":{}}')
  })

  it('suma los del proyecto, pero no puede suplantar un conector por clave igual', () => {
    const base = '{"mcpServers":{"figma":{"type":"http","url":"https://x"}}}'
    const extra = { ...project, figma: { command: 'propio' } }
    const cfg = JSON.parse(mergeMcpConfig(base, extra) ?? '{}')
    expect(cfg.mcpServers.figma).toEqual({ type: 'http', url: 'https://x' })
    expect(cfg.mcpServers['codebase-memory']).toEqual({ command: 'node', args: ['g.js'] })
  })
})
