import { describe, expect, it } from 'vitest'
import { isPrivateHost } from './private-host'
import { unmapIpv4 } from './unmap-ipv4'

describe('unmapIpv4 (quitar el disfraz IPv6 a un IPv4)', () => {
  it('la forma con PUNTOS, que es la que devuelve dns.lookup', () => {
    expect(unmapIpv4('::ffff:127.0.0.1')).toBe('127.0.0.1')
    expect(unmapIpv4('::ffff:169.254.169.254')).toBe('169.254.169.254')
  })

  it('la forma HEXADECIMAL, que es la que produce new URL(...)', () => {
    // El hueco real: `new URL('http://[::ffff:127.0.0.1]')` normaliza a esto.
    expect(unmapIpv4('::ffff:7f00:1')).toBe('127.0.0.1')
    expect(unmapIpv4('::ffff:a9fe:a9fe')).toBe('169.254.169.254')
    expect(unmapIpv4('::ffff:c0a8:1')).toBe('192.168.0.1')
  })

  it('la forma sin comprimir tambien', () => {
    expect(unmapIpv4('0:0:0:0:0:ffff:7f00:1')).toBe('127.0.0.1')
  })

  it('lo que no es un mapeado se devuelve intacto', () => {
    expect(unmapIpv4('::1')).toBe('::1')
    expect(unmapIpv4('93.184.216.34')).toBe('93.184.216.34')
    expect(unmapIpv4('ejemplo.com')).toBe('ejemplo.com')
    expect(unmapIpv4('2001:db8::1')).toBe('2001:db8::1')
  })
})

describe('isPrivateHost con literales disfrazados', () => {
  it('EL HUECO REAL: las dos formas mapeadas del loopback quedan bloqueadas', () => {
    expect(isPrivateHost('::ffff:127.0.0.1')).toBe(true)
    expect(isPrivateHost('::ffff:7f00:1')).toBe(true)
    expect(isPrivateHost('[::ffff:7f00:1]')).toBe(true) // con corchetes, como en una URL
  })

  it('los metadatos de la nube tampoco pasan disfrazados', () => {
    expect(isPrivateHost('::ffff:169.254.169.254')).toBe(true)
    expect(isPrivateHost('::ffff:a9fe:a9fe')).toBe(true)
  })

  it('la red privada disfrazada tampoco', () => {
    expect(isPrivateHost('::ffff:c0a8:1')).toBe(true) // 192.168.0.1
    expect(isPrivateHost('::ffff:0a00:1')).toBe(true) // 10.0.0.1
  })

  it('una IP publica mapeada sigue siendo publica: no se bloquea de mas', () => {
    expect(isPrivateHost('::ffff:93.184.216.34')).toBe(false)
    expect(isPrivateHost('::ffff:5db8:d822')).toBe(false)
  })

  it('lo que ya bloqueaba sigue bloqueado', () => {
    expect(isPrivateHost('127.0.0.1')).toBe(true)
    expect(isPrivateHost('localhost')).toBe(true)
    expect(isPrivateHost('::1')).toBe(true)
    expect(isPrivateHost('93.184.216.34')).toBe(false)
  })
})
