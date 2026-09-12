import { describe, expect, it } from 'vitest'
import { fechaDeCierre, NO_SE_RESOLVIO } from './fecha-de-cierre'

describe('la fecha de cierre dice la verdad, incluso cuando no hay', () => {
  it('SIN FECHA: lo dice, no inventa ninguna', () => {
    // Las veinte fusiones tienen resolved_at en null a proposito. Rellenarlo
    // con cualquier otra fecha convertiria una ausencia deliberada en un dato.
    expect(fechaDeCierre(null)).toBe(NO_SE_RESOLVIO)
    expect(fechaDeCierre(null)).not.toMatch(/\d/)
  })

  it('con fecha: la pinta legible, con el ano completo', () => {
    expect(fechaDeCierre('2026-09-12T10:00:00Z')).toContain('2026')
  })
})
