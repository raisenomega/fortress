import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Hallazgo 0445f904 (accesibilidad, WCAG 1.3.1/3.3.2): el input de la nota de
 *  refuerzo solo tenia placeholder, que desaparece al escribir y no es nombre
 *  accesible. Misma clase que curo 2598e5df en el Terminal y en Construir. */
describe('el campo de nota de refuerzo tiene nombre accesible, no solo placeholder', () => {
  const src = readFileSync('src/presentation/components/system/CapabilityNotes.tsx', 'utf8')

  it('el input lleva aria-label con su nombre', () => {
    expect(src).toContain('aria-label="Nota de refuerzo de aprendizaje"')
  })

  it('el placeholder sigue siendo pista, distinta del nombre', () => {
    expect(src).toContain('placeholder="Deja una nota que la oriente"')
  })
})
