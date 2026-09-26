import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Hallazgo 060262c7 (accesibilidad, LOW): el documento del renderer no declaraba
 *  idioma, y el lector de pantalla pronunciaba el castellano con reglas inglesas.
 *  El marcador es el que verifica el kit de cierre. */
describe('el documento del renderer declara su idioma', () => {
  it('index.html lleva lang="es"', () => {
    expect(readFileSync('src/renderer/index.html', 'utf8')).toContain('<html lang="es">')
  })
})
