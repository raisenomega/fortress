import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const fuente = (ruta: string): string =>
  readFileSync(join(process.cwd(), 'src/presentation', ruta), 'utf8')

/**
 * `aria-modal` es una PROMESA: le dice al lector de pantalla que lo de detras no
 * existe. El `<div>` no la cumple solo, y durante semanas el Modal la declaro sin
 * cumplirla: ni Escape, ni foco al abrir, ni trampa, ni retorno. Sin DOM en los
 * tests, esto fija que el cableado existe; la aritmetica del Tab tiene el suyo
 * en `salto-del-tab.test.ts`.
 *
 * Vive en el Modal y no en sus trece consumidores a proposito: arreglarlo en uno
 * dejaria doce sin arreglar, y el siguiente que nazca tampoco lo traeria.
 */
describe('el Modal cumple lo que aria-modal promete', () => {
  const modal = fuente('components/common/Modal.tsx')

  it('quien declara aria-modal cablea Escape y el foco', () => {
    expect(modal).toContain('aria-modal')
    expect(modal).toContain('useCerrarConEscape(onClose)')
    expect(modal).toContain('useFocoDelDialogo(caja)')
  })

  it('la caja del dialogo es enfocable por codigo y es la que lleva el ref', () => {
    expect(modal).toMatch(/ref=\{caja\}\s+tabIndex=\{-1\}\s+role="dialog"/)
  })

  it('el foco vuelve a quien abrio el dialogo, y no a un nodo que ya no esta', () => {
    const foco = fuente('hooks/useFocoDelDialogo.ts')
    expect(foco).toContain('previo?.isConnected')
    expect(foco).toContain('previo.focus()')
  })

  it('un hijo con autoFocus conserva el foco que pidio', () => {
    expect(fuente('hooks/useFocoDelDialogo.ts')).toContain(
      'if (!nodo.contains(document.activeElement)) nodo.focus()'
    )
  })

  it('Escape llama al mismo onClose que el fondo: ninguna via de cierre nueva', () => {
    const escape = fuente('hooks/useCerrarConEscape.ts')
    expect(escape).toContain("if (event.key === 'Escape') onClose()")
    expect(modal).toContain('onClick={onClose}')
  })
})
