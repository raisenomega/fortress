import { describe, expect, it } from 'vitest'
import { parseConnectorUrl } from './connector-url'

describe('parseConnectorUrl', () => {
  it('acepta un endpoint https normal', () => {
    const r = parseConnectorUrl('  https://mcp.figma.com/mcp  ')
    expect(r.ok && r.value).toBe('https://mcp.figma.com/mcp')
  })

  it('rechaza http: un MCP en claro es una fuga', () => {
    expect(parseConnectorUrl('http://mcp.interno.local/mcp').ok).toBe(false)
  })

  it('rechaza esquemas que no son web', () => {
    expect(parseConnectorUrl('file:///etc/passwd').ok).toBe(false)
    expect(parseConnectorUrl('javascript:alert(1)').ok).toBe(false)
  })

  it('rechaza un dominio pelado en vez de asumir https', () => {
    expect(parseConnectorUrl('mcp.figma.com/mcp').ok).toBe(false)
  })

  it('rechaza credenciales incrustadas en la URL', () => {
    expect(parseConnectorUrl('https://user:token@mcp.figma.com/mcp').ok).toBe(false)
  })

  it('rechaza vacio', () => {
    expect(parseConnectorUrl('   ').ok).toBe(false)
  })
})
