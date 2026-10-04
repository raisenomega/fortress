import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Hallazgo a6fda8a0 (accesibilidad, WCAG 1.3.1/3.3.2): el input de la pregunta
 *  estructural solo tenia placeholder, que no es nombre accesible. */
describe('el campo de pregunta estructural tiene nombre accesible, no solo placeholder', () => {
  it('el del comparador A/B del grafo', () => {
    expect(readFileSync('src/presentation/components/graph/GraphAbBox.tsx', 'utf8')).toContain('aria-label="Pregunta estructural para comparar A/B"') // prettier-ignore
  })
})
