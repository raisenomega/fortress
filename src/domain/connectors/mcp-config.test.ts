import { describe, expect, it } from 'vitest'
import type { ConnectorState } from './connector'
import { buildMcpConfig } from './mcp-config'

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
