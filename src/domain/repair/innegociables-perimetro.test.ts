import { describe, expect, it } from 'vitest'
import { cubierto } from './innegociables-fixture'
import { puedeTrabajarse } from './alcance'
import { DEFENSAS_DEL_PERIMETRO } from './innegociables-perimetro'

/**
 * ADR-107 — el perimetro del Motor, blindado al cerrarlo.
 *
 * Si la politica de «el Motor es de FORTRESS» no fuera innegociable, un fix del
 * propio motor podria ensancharla y darse permiso sobre codigo ajeno. La unica
 * barrera seria que quien firma se diera cuenta, y eso no sobrevive a un lote.
 */
describe('el perimetro del Motor es innegociable (ADR-107)', () => {
  it.each([...DEFENSAS_DEL_PERIMETRO])('%s esta en la lista', (fichero) => {
    expect({ fichero, protegido: cubierto(fichero) }).toEqual({ fichero, protegido: true })
  })

  it('y el motor no puede proponer un fix ahi, en NINGUN modo', () => {
    for (const f of DEFENSAS_DEL_PERIMETRO) expect(puedeTrabajarse(f)).toBe(false)
  })

  /**
   * La lista se fija ENTERA y no se recorre. Un `it.each` sobre ella corre menos
   * casos cuando se le quita una fila, y pasa: medido con un mutante que
   * SOBREVIVIO aqui, el mismo hueco que ya aparecio en el guardian de las notas.
   */
  it('la lista no adelgaza en silencio: se fija entera', () => {
    expect([...DEFENSAS_DEL_PERIMETRO]).toEqual([
      'src/domain/repair/vehiculo-del-motor.ts',
      'src/application/repair/plan-repair.ts',
      'src/application/repair/retry-repair.ts'
    ])
  })
})
