import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Hallazgo a1b4916d (accesibilidad, WCAG 4.1.3): el veredicto de la API key
 *  se montaba sin role="status" ni aria-live, y como sus dos sedes lo montan
 *  solo cuando ya hay veredicto, el lector de pantalla no anunciaba nada. */
describe('el veredicto de la API key se anuncia al lector de pantalla', () => {
  const src = readFileSync('src/presentation/components/settings/ApiKeyVerdictNote.tsx', 'utf8')

  // Como Notice, pero sin la prop `callado`: este veredicto no vive dentro
  // del Toaster, asi que el rol va sin condicion.
  it('el parrafo del veredicto es una region de estado', () => {
    expect(src).toContain('role="status"')
  })

  // `status` y no `alert`: el repo reserva `alert` para errores criticos del
  // sistema, y un veredicto que el propio usuario pidio no debe interrumpir.
  it('no interrumpe como si fuera un error critico', () => {
    expect(src).not.toContain('role="alert"')
  })
})
