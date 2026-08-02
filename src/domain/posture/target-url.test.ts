import { describe, expect, it } from 'vitest'
import { parseTarget } from './target-url'

describe('parseTarget', () => {
  it('acepta un dominio pelado y asume https', () => {
    const t = parseTarget('midominio.com')
    expect(t.ok && t.value.url).toBe('https://midominio.com')
  })

  it('conserva el host con puerto', () => {
    const t = parseTarget('http://localhost:3000/ruta')
    expect(t.ok && t.value.host).toBe('localhost:3000')
    expect(t.ok && t.value.https).toBe(false)
  })

  it('rechaza esquemas que no son web: nada de file://', () => {
    expect(parseTarget('file:///etc/passwd').ok).toBe(false)
  })

  it('rechaza basura', () => {
    expect(parseTarget('   ').ok).toBe(false)
  })
})
