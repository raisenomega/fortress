import { describe, expect, it } from 'vitest'
import { buildAllowedTools } from './build-allowed-tools'

describe('buildAllowedTools', () => {
  it('lectura: solo tools de LECTURA del grafo + archivos; sin Bash ni escritura', () => {
    const tools = buildAllowedTools('lectura', true, ['test:unit'])
    expect(tools).toContain('mcp__codebase-memory__get_architecture')
    expect(tools).toContain('mcp__codebase-memory__trace_path')
    expect(tools).toContain('Read')
    expect(tools).not.toContain('Bash')
    // index_repository (escribe) NO se permite en lectura: tiene su propia accion.
    expect(tools.some((tool) => tool.includes('index_repository'))).toBe(false)
    expect(tools.some((tool) => tool.startsWith('Bash('))).toBe(false)
  })

  it('plan: la regla del grafo (prefijo), sin autoverificacion', () => {
    expect(buildAllowedTools('plan', true, ['test:unit'])).toEqual(['mcp__codebase-memory'])
  })

  it('acceptEdits de confianza: grafo + autoverificacion de los scripts reales', () => {
    const tools = buildAllowedTools('acceptEdits', true, ['type-check'])
    expect(tools).toContain('mcp__codebase-memory')
    expect(tools).toContain('Bash(npm run type-check)')
  })
})
