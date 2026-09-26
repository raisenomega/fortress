import { describe, expect, it } from 'vitest'
import { sinBloqueDeNotas } from './extraer-notas'

const BLOQUE = 'NOTAS:[{"kind":"gap","area":"otro","note":"me falto X"}]:END-NOTAS'

describe('sinBloqueDeNotas: el bloque no llega al operador ni al disco del cliente', () => {
  it('quita el bloque y deja la prosa limpia', () => {
    expect(sinBloqueDeNotas(`El plan:\n1. a\n2. b\n\n${BLOQUE}\n`)).toBe('El plan:\n1. a\n2. b')
  })

  it('sin bloque, el texto vuelve tal cual (recortado)', () => {
    expect(sinBloqueDeNotas('solo prosa  ')).toBe('solo prosa')
  })
})
