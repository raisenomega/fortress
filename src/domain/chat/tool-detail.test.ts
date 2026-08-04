import { describe, expect, it } from 'vitest'
import { redactSecrets, toolDetail } from './tool-detail'

describe('redactSecrets', () => {
  it('tacha una API key de Anthropic', () => {
    expect(redactSecrets('export ANTHROPIC_API_KEY=sk-ant-abc123def456')).not.toContain('abc123def456')
    expect(redactSecrets('sk-ant-abc123def456')).toContain('***')
  })

  it('tacha KEY=..., TOKEN=... y Bearer', () => {
    expect(redactSecrets('TOKEN=supersecreto123')).toContain('***')
    expect(redactSecrets('curl -H "Authorization: Bearer tok_secreto"')).toContain('***')
  })

  it('deja pasar un comando normal', () => {
    expect(redactSecrets("grep -rn 'foo' src")).toBe("grep -rn 'foo' src")
  })
})

describe('toolDetail', () => {
  it('Bash muestra el comando, redactado', () => {
    expect(toolDetail('Bash', { command: 'grep -rn foo src' })).toBe('grep -rn foo src')
    expect(toolDetail('Bash', { command: 'echo TOKEN=abc123secreto' })).toContain('***')
  })

  it('Read y Grep muestran su objetivo tal cual', () => {
    expect(toolDetail('Read', { file_path: 'src/preload/index.ts' })).toBe('src/preload/index.ts')
    expect(toolDetail('Grep', { pattern: 'window.electron' })).toBe('window.electron')
  })

  it('las herramientas del grafo muestran su consulta', () => {
    expect(toolDetail('mcp__codebase-memory__search_code', { query: 'JSON.parse' })).toBe('JSON.parse')
  })

  it('sin input util devuelve undefined', () => {
    expect(toolDetail('Bash', {})).toBeUndefined()
    expect(toolDetail('Read', undefined)).toBeUndefined()
  })

  it('acorta lo muy largo', () => {
    const detalle = toolDetail('Bash', { command: 'a '.repeat(200) })
    expect((detalle ?? '').length).toBeLessThan(130)
  })
})
