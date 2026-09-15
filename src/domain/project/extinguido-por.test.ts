import { describe, expect, it } from 'vitest'
import { EXTINGUIDO_POR, esExtinguidoPor } from './extinguido-por'

describe('quien cerro un hallazgo: tres autores, y NULL no es ninguno (ADR-088)', () => {
  it("'terminal' es un autor valido, junto a los dos de ADR-087", () => {
    expect(EXTINGUIDO_POR).toEqual(['agente', 'operador', 'terminal'])
    expect(esExtinguidoPor('terminal')).toBe(true)
  })

  it('los dos autores de antes siguen siendolo', () => {
    expect(esExtinguidoPor('agente')).toBe(true)
    expect(esExtinguidoPor('operador')).toBe(true)
  })

  it('lo que no es un autor no pasa: ni un nombre inventado ni el «no consta»', () => {
    // Abrir el vocabulario a uno no lo abre a cualquiera: la columna es TEXT
    // libre y lo unico que la mantiene cerrada es esta lista.
    expect(esExtinguidoPor('ejecutor')).toBe(false)
    expect(esExtinguidoPor('Terminal')).toBe(false)
    expect(esExtinguidoPor(null)).toBe(false)
  })
})
