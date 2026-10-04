import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Hallazgo e2135b41 (accesibilidad, WCAG 1.3.1/3.3.2): el input del nombre
 *  solo tenia placeholder, que desaparece al escribir y no es nombre accesible. */
describe('el campo de nombre de Proponer capacidad tiene nombre accesible', () => {
  it('el input lleva aria-label, no solo placeholder', () => {
    expect(readFileSync('src/presentation/components/system/ProposeCapability.tsx', 'utf8')).toContain('aria-label="Nombre de la capacidad"') // prettier-ignore
  })
})
