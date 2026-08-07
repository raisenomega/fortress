import { describe, expect, it } from 'vitest'
import { readProjectDoc } from './docs-reader'

describe('readProjectDoc (guard de ruta)', () => {
  it('rechaza traversal y nombres con separadores', () => {
    expect(readProjectDoc('/tmp/p', '../../etc/passwd').ok).toBe(false)
    expect(readProjectDoc('/tmp/p', 'sub/x.md').ok).toBe(false)
    expect(readProjectDoc('/tmp/p', '..\\x.md').ok).toBe(false)
  })

  it('rechaza lo que no sea .md', () => {
    expect(readProjectDoc('/tmp/p', 'secrets.json').ok).toBe(false)
    expect(readProjectDoc('/tmp/p', '.env').ok).toBe(false)
  })
})
