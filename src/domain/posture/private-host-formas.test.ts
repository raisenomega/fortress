import { describe, expect, it } from 'vitest'
import { isPrivateHost } from './private-host'

/**
 * Se prueba `isPrivateHost` DIRECTAMENTE y no a traves de una URL a proposito.
 * `new URL()` normaliza las formas numericas por su cuenta —`2130706433` sale
 * ya como `127.0.0.1`—, asi que probarlo por ahi no prueba nada de este filtro:
 * mide el parser de Node. Es la razon de que una mutacion que devolvia el filtro
 * a mirar solo el decimal punteado siguiera pasando en verde.
 *
 * Hoy todos sus llamadores normalizan antes (tres por `URL`, uno con resultados
 * de DNS), asi que esto NO tapa un agujero abierto: hace correcta la respuesta
 * del predicado por si misma, en vez de depender de quien pregunte.
 */
const LOOPBACK = ['127.0.0.1', '2130706433', '0x7f000001', '0177.0.0.1', '127.1', '0x7f.0.0.1']

describe('el filtro reconoce la direccion, no la forma de escribirla', () => {
  it.each(LOOPBACK)('%s es loopback', (host) => {
    expect(isPrivateHost(host)).toBe(true)
  })

  it('los metadatos de la nube, tambien en decimal', () => {
    expect(isPrivateHost('2852039166')).toBe(true)
    expect(isPrivateHost('169.254.169.254')).toBe(true)
  })

  it('lo publico sigue siendo publico, escrito como sea', () => {
    expect(isPrivateHost('8.8.8.8')).toBe(false)
    expect(isPrivateHost('134744072')).toBe(false)
    expect(isPrivateHost('ejemplo.com')).toBe(false)
  })
})
