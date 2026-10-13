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

/** Hallazgo ccfc7f8c (accesibilidad, WCAG 4.1.3 AA): la region role="status"
 *  entraba en el DOM ya con el veredicto, y los lectores solo anuncian cambios
 *  dentro de una region que ya estaba montada. */
describe('el veredicto vive en una region role="status" siempre montada', () => {
  const form = readFileSync('src/presentation/components/settings/ApiKeyForm.tsx', 'utf8')
  const note = readFileSync('src/presentation/components/settings/ApiKeyVerdictNote.tsx', 'utf8')

  it('el formulario monta la region sin condicion', () => {
    expect(form).toContain('<ApiKeyVerdictRegion verdict={verdict} />')
    expect(form).not.toMatch(/verdict \?/)
  })

  it('lo condicional es el contenido, y la nota interior va callada (sin region anidada)', () => {
    expect(note).toContain('<div role="status">{verdict ? <ApiKeyVerdictNote verdict={verdict} callado /> : null}</div>') // prettier-ignore
  })
})
