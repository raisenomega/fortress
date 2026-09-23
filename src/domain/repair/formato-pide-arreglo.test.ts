import { describe, expect, it } from 'vitest'
import { FORMATO } from './analysis-prompt-formato'

describe('el formato pide el arreglo estructurado (ADR-102 §2)', () => {
  it('nombra la clave, su forma y lo que FORTRESS hara con ella', () => {
    const texto = FORMATO.join('\n')
    expect(texto).toContain('"arreglo"')
    expect(texto).toContain('"line":numero o null')
    expect(texto).toContain('ANTES de generar')
  })
})
