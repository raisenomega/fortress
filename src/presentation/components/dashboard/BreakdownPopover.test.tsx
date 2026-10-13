import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const popover = readFileSync(
  join(process.cwd(), 'src/presentation/components/dashboard/BreakdownPopover.tsx'),
  'utf8'
)

/** Sin DOM en los tests: esto fija el cableado de teclado y semantica del popover. */
describe('el popover del desglose es accesible por teclado', () => {
  it('es un dialogo NO modal, con nombre y enfocable por codigo', () => {
    expect(popover).toMatch(/ref=\{ref\}\s+tabIndex=\{-1\}\s+role="dialog"\s+aria-label="Desglose de calidad"/)
    expect(popover).not.toContain('aria-modal=')
  })

  it('Escape cierra con el mismo close que el clic fuera', () => {
    expect(popover).toContain('useCerrarConEscape(close)')
  })

  it('lleva el foco a la caja y lo devuelve sin atrapar el Tab', () => {
    expect(popover).toContain('useFocoDelPopover(ref)')
    expect(popover).toContain('if (!nodo.contains(document.activeElement)) nodo.focus()')
    expect(popover).toContain('previo?.isConnected')
    expect(popover).not.toContain('useFocoDelDialogo(')
  })

  it('conserva la excepcion del chevron en el clic fuera', () => {
    expect(popover).toContain("target.closest('[data-breakdown-toggle]')")
  })
})
