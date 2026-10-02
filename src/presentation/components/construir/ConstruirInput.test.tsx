import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Hallazgo d75eb0fb (accesibilidad, WCAG 2.4.7): el textarea de Construir
 *  llevaba outline-none y nada pintaba su foco. Ahora lo pinta la caja. */
describe('el campo de Construir tiene indicador de foco visible', () => {
  const src = readFileSync('src/presentation/components/construir/ConstruirInput.tsx', 'utf8')

  it('si suprime el outline, la caja lo compensa con el anillo del token ring', () => {
    if (src.includes('outline-none')) {
      expect(src).toContain('has-[textarea:focus-visible]:outline-2')
      expect(src).toContain('has-[textarea:focus-visible]:outline-ring')
    }
  })
})
