import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Hallazgo 44caad67 (accesibilidad, WCAG 1.3.1/3.3.2 A): el campo de la API key
 *  solo tenia placeholder, que desaparece al escribir y los lectores de pantalla
 *  no exponen como nombre. El nombre describe el campo, no la accion, para que
 *  valga igual en el onboarding y en ajustes. */
describe('el campo de la API key tiene nombre accesible, no solo placeholder', () => {
  it('lleva aria-label en el input', () => {
    expect(readFileSync('src/presentation/components/settings/ApiKeyForm.tsx', 'utf8')).toContain('aria-label="API key de Claude"') // prettier-ignore
  })
})
