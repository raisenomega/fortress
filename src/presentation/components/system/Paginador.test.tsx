import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Hallazgo cfcf2fe0 (accesibilidad): los botones del Paginador solo llevaban
 *  el chevron, que va con aria-hidden; el lector anunciaba solo «boton». */
describe('los botones del Paginador tienen nombre accesible', () => {
  const fuente = readFileSync('src/presentation/components/system/Paginador.tsx', 'utf8')

  it('el de pagina anterior', () => {
    expect(fuente).toContain('aria-label="Pagina anterior"')
  })

  it('el de pagina siguiente', () => {
    expect(fuente).toContain('aria-label="Pagina siguiente"')
  })
})
