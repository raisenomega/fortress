import { describe, expect, it } from 'vitest'
import { buildArgs } from './claude-cli'

const AGENTS = { 'security-reviewer': { description: 'Audita', prompt: 'Eres el auditor' } }

/**
 * buildArgs es la ruta por la que corren TODOS los agentes. Lo que se prueba
 * aqui no es que el flag nuevo funcione, sino que no haber tocado nada sigue
 * produciendo exactamente los mismos argumentos que antes.
 */
describe('buildArgs con MCP', () => {
  it('sin conectores los argumentos salen identicos a la firma vieja', () => {
    expect(buildArgs('hola', 'plan', AGENTS, null, 3)).toEqual(
      buildArgs('hola', 'plan', AGENTS, null, 3, null)
    )
  })

  it('sin conectores no aparece --mcp-config', () => {
    expect(buildArgs('hola', 'plan', AGENTS, null, 3)).not.toContain('--mcp-config')
    expect(buildArgs('hola', 'plan', AGENTS, null, 3, null)).not.toContain('--mcp-config')
  })

  it('con configuracion la anade al final sin romper el resto', () => {
    const base = buildArgs('hola', 'plan', AGENTS, 'security-reviewer', 3)
    const conMcp = buildArgs('hola', 'plan', AGENTS, 'security-reviewer', 3, '{"mcpServers":{}}')

    expect(conMcp.slice(0, base.length)).toEqual(base)
    expect(conMcp.slice(base.length)).toEqual(['--mcp-config', '{"mcpServers":{}}'])
  })
})
