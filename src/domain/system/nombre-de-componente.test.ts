import { describe, expect, it } from 'vitest'
import { nombreDeComponente, observacionDeRender } from './observacion-de-render'

const RUTA_DEL_CLIENTE = '/media/disco/ACME/src/api/billing.ts'

/**
 * El filtro que hace segura la mitad «donde» de la nota. El bundle de produccion
 * NO se minifica —se midio: 960 KB con `function ScanView() {` literal—, asi que
 * estos nombres llegan de verdad. Pero la garantia no descansa en esa medicion,
 * igual que no descansaba en que los 110 canales usaran una constante.
 */
describe('de que componente habla un fallo de render', () => {
  it('el primer marco en PascalCase: los de minuscula son HTML y no dicen nada', () => {
    expect(nombreDeComponente('\n    at div\n    at span\n    at ProjectList')).toBe('ProjectList')
  })

  it('SEGURO POR CONSTRUCCION: una ruta no tiene forma de componente', () => {
    expect(nombreDeComponente(`\n    at ${RUTA_DEL_CLIENTE}`)).toBe('desconocido')
    expect(nombreDeComponente(`\n    at ${RUTA_DEL_CLIENTE}:140:3`)).toBe('desconocido')
    expect(observacionDeRender(`\n    at ${RUTA_DEL_CLIENTE}`, 'Error').note).toBe(
      'FORTRESS rompio pintando desconocido: Error'
    )
  })

  it('y la ruta del marco se queda fuera aunque el componente sea real', () => {
    // Es el caso normal: React pega el fichero y la linea detras del nombre.
    const marco = `\n    at ScanView (http://localhost${RUTA_DEL_CLIENTE}:140:3)`
    expect(nombreDeComponente(marco)).toBe('ScanView')
    expect(observacionDeRender(marco, 'Error').note).not.toContain('/media/')
  })

  it('LA GARANTIA, dicha entera: salga lo que salga, es un identificador', () => {
    // Mas fuerte que enumerar entradas raras. Lo que devuelve NO PUEDE llevar
    // barras, espacios ni dos puntos, asi que no puede llevar una ruta ni una
    // frase del cliente venga el arbol como venga.
    const raros = ['\n at a b c', `\n at ${RUTA_DEL_CLIENTE} X`, '\n at 9Cosa', '\n at _x', 'ruido']
    for (const arbol of raros) {
      expect(nombreDeComponente(arbol)).toMatch(/^(?:[A-Z][A-Za-z0-9_$]*|desconocido)$/)
    }
  })

  it('y un arbol ausente, vacio o de otro tipo cae igual, sin lanzar', () => {
    // Llega de React, pero `componentStack` es opcional en su propio tipo.
    expect(nombreDeComponente(undefined)).toBe('desconocido')
    expect(nombreDeComponente('')).toBe('desconocido')
    expect(nombreDeComponente(42)).toBe('desconocido')
    expect(nombreDeComponente('\n    at div\n    at span')).toBe('desconocido')
  })
})
