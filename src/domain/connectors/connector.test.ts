import { describe, expect, it } from 'vitest'
import { BUILTIN_CONNECTORS } from './connector-catalog'
import { activeConnectors, isConnected, type ConnectorState } from './connector'

function state(over: Partial<ConnectorState>): ConnectorState {
  return {
    id: 'x',
    name: 'X',
    url: 'https://mcp.x.com/mcp',
    description: '',
    category: 'desarrollo',
    builtin: false,
    enabled: true,
    ...over
  }
}

describe('catalogo predefinido', () => {
  it('trae Figma y Canva con sus endpoints', () => {
    const figma = BUILTIN_CONNECTORS.find((c) => c.id === 'figma')
    expect(figma?.url).toBe('https://mcp.figma.com/mcp')
    expect(BUILTIN_CONNECTORS.find((c) => c.id === 'canva')?.url).toBe('https://mcp.canva.com/mcp')
  })

  it('deja GitHub y Supabase sin url y marcados via CLI', () => {
    for (const id of ['github', 'supabase']) {
      const found = BUILTIN_CONNECTORS.find((c) => c.id === id)
      expect(found?.url).toBe('')
      expect(found?.description).toContain('via CLI')
    }
  })

  it('ningun predefinido usa http en claro', () => {
    const inseguro = BUILTIN_CONNECTORS.filter((c) => c.url !== '' && !c.url.startsWith('https://'))
    expect(inseguro).toEqual([])
  })

  it('no repite ids', () => {
    expect(new Set(BUILTIN_CONNECTORS.map((c) => c.id)).size).toBe(BUILTIN_CONNECTORS.length)
  })
})

describe('isConnected', () => {
  it('sin url no esta conectado aunque este activo', () => {
    expect(isConnected(state({ url: '' }))).toBe(false)
  })

  it('con url pero apagado tampoco', () => {
    expect(isConnected(state({ enabled: false }))).toBe(false)
  })

  it('activeConnectors deja fuera los que no pueden viajar', () => {
    const all = [state({ id: 'a' }), state({ id: 'b', url: '' }), state({ id: 'c' })]
    expect(activeConnectors(all).map((c) => c.id)).toEqual(['a', 'c'])
  })
})
