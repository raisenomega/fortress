import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Deuda #2: la guia vive EN la pagina de firma y mide de verdad. Tests de
 * fuente, como los de a11y: la UI de este repo se verifica leyendo lo que
 * renderiza y con el smoke, no montando un DOM.
 */
const vista = readFileSync('src/presentation/components/system/FirmaView.tsx', 'utf8')
const guia = readFileSync('src/presentation/components/system/GuiaDeFirma.tsx', 'utf8')
const resultado = readFileSync('src/presentation/components/system/ResultadoDeLaTanda.tsx', 'utf8')
const avisos = readFileSync('src/presentation/components/system/AvisosDeLaGuia.tsx', 'utf8')

describe('la guia del orden de firma esta en la pagina', () => {
  it('FirmaView monta la guia dentro de la cola, no en otra pagina', () => {
    expect(vista).toContain('<GuiaDeFirma projectId=')
  })

  it('la guia mide por el puente de la tanda y nombra a los culpables', () => {
    expect(guia).toContain('api().tanda.medir(')
    expect(guia).toContain('Medir la tanda')
    expect(resultado).toContain('tanda.culpables')
  })

  it('avisa de lo que cada regla estatica sabe: grupos y dependencias al final', () => {
    expect(guia).toContain('<AvisosDeLaGuia guia=')
    expect(avisos).toContain('guia.grupos')
    expect(avisos).toContain('guia.dependencias')
    expect(avisos).toContain('caducan sin medir')
  })

  it('solo tokens: ni un color a mano en la guia ni en sus piezas', () => {
    for (const src of [guia, resultado, avisos]) {
      expect(src).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
      expect(src).not.toContain('rgb(')
    }
  })
})
