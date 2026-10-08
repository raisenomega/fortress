import { describe, expect, it } from 'vitest'
import { partesConEnlace } from './markdown-links'

/** PASO 94: SOLO esquemas web llegan a ser <a>. Un javascript:/file:/data: se
 *  queda en TEXTO — nunca existe como link, asi no hay clic que gatear. */
describe('los enlaces del markdown, acotados a web', () => {
  it('el link [texto](url) se separa con su etiqueta y su url', () => {
    expect(partesConEnlace('mira [la guia](https://example.com/g) y sigue')).toEqual([
      { tipo: 'texto', texto: 'mira ' },
      { tipo: 'link', texto: 'la guia', url: 'https://example.com/g' },
      { tipo: 'texto', texto: ' y sigue' }
    ])
  })

  it('la URL pelada http/https tambien es link', () => {
    const partes = partesConEnlace('docs en https://example.com/x?a=1 ya')
    expect(partes).toContainEqual({ tipo: 'link', texto: 'https://example.com/x?a=1', url: 'https://example.com/x?a=1' }) // prettier-ignore
  })

  it('CANDADO: javascript:, file: y data: NO llegan a link — quedan como texto', () => {
    for (const mala of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hola']) {
      const partes = partesConEnlace(`toca [aqui](${mala}) va`)
      expect(partes.some((p) => p.tipo === 'link')).toBe(false)
      expect(partes.map((p) => p.texto).join('')).toContain('aqui')
    }
  })

  it('sin enlaces, el texto pasa entero en una pieza', () => {
    expect(partesConEnlace('nada que ver')).toEqual([{ tipo: 'texto', texto: 'nada que ver' }])
  })
})
