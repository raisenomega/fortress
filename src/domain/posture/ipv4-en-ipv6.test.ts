import { describe, expect, it } from 'vitest'
import { isPrivateHost } from './private-host'
import { unmapIpv4 } from './unmap-ipv4'

describe('las formas de escribir una IPv4 dentro de una IPv6', () => {
  it.each([
    ['::ffff:127.0.0.1', 'mapeada con puntos — la que da dns.lookup'],
    ['::ffff:7f00:1', 'mapeada en hexadecimal — la que da new URL'],
    ['::127.0.0.1', 'compatible, la forma vieja (RFC 4291)'],
    ['::7f00:1', 'compatible en hexadecimal'],
    ['0:0:0:0:0:ffff:127.0.0.1', 'sin comprimir'],
    ['0000:0000:0000:0000:0000:ffff:7f00:1', 'sin comprimir y con relleno'],
    ['0000:0000:0000:0000:0000:0000:127.0.0.1', 'compatible, sin comprimir']
  ])('%s se desenmascara — %s', (host) => {
    expect(unmapIpv4(host)).toBe('127.0.0.1')
  })

  it('y por tanto el filtro las ve todas como privadas', () => {
    // El predicado tiene que ser correcto AUNQUE `new URL` normalice casi todas:
    // el llamante de manana puede venir de `dns.lookup`, que escribe de otro modo.
    for (const host of ['[::ffff:127.0.0.1]', '[::127.0.0.1]', '[::ffff:a9fe:a9fe]']) {
      expect({ host, privado: isPrivateHost(host) }).toEqual({ host, privado: true })
    }
  })

  it('el loopback IPv6 no se confunde con una IPv4 y sigue siendo privado', () => {
    // `::1` encaja con el prefijo de la forma compatible pero su cola no es una
    // direccion: se devuelve tal cual, y la regla de IPv6 lo caza igual.
    expect(unmapIpv4('::1')).toBe('::1')
    expect(isPrivateHost('[::1]')).toBe(true)
  })

  it('una IPv6 publica NO se desenmascara ni se clasifica de mas', () => {
    expect(unmapIpv4('2001:db8::1')).toBe('2001:db8::1')
    expect(isPrivateHost('[2001:4860:4860::8888]')).toBe(false)
  })
})
