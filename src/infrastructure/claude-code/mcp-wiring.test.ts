import { describe, expect, it } from 'vitest'
import { buildMcpConfig } from '@domain/connectors/mcp-config'
import type { ConnectorState } from '@domain/connectors/connector'

const connector = (over: Partial<ConnectorState>): ConnectorState => ({
  id: 'figma',
  name: 'Figma',
  url: 'https://mcp.figma.com/mcp',
  description: '',
  category: 'diseno',
  builtin: true,
  enabled: false,
  ...over
})

describe('cable vivo de conectores', () => {
  it('sin conectores activos, la config es null: la ejecucion no cambia', () => {
    // Es la garantia de cero regresion: null -> buildArgs no anade --mcp-config.
    expect(buildMcpConfig([connector({ enabled: false })])).toBeNull()
  })

  it('un conector activo con url produce su config MCP', () => {
    const json = buildMcpConfig([connector({ enabled: true })])
    expect(json).not.toBeNull()
    expect(JSON.parse(json as string).mcpServers.figma.url).toBe('https://mcp.figma.com/mcp')
  })

  it('un conector activo SIN url (via CLI) no entra en la config', () => {
    const github = connector({ id: 'github', url: '', enabled: true })
    expect(buildMcpConfig([github])).toBeNull()
  })
})
