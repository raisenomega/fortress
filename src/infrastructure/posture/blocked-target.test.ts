import { describe, expect, it } from 'vitest'
import { blockedTarget } from './blocked-target'

describe('blockedTarget (la capa que cubre los literales)', () => {
  it('EL BYPASS: el loopback mapeado en IPv6 queda bloqueado', () => {
    // new URL lo normaliza a [::ffff:7f00:1]; antes atravesaba las dos capas.
    expect(blockedTarget('http://[::ffff:127.0.0.1]:8080')).not.toBeNull()
    expect(blockedTarget('http://[::ffff:7f00:1]:8080')).not.toBeNull()
  })

  it('el literal IPv4 directo, que safeLookup nunca llega a ver', () => {
    expect(blockedTarget('http://127.0.0.1:8080')).not.toBeNull()
    expect(blockedTarget('http://10.0.0.5/admin')).not.toBeNull()
    expect(blockedTarget('http://169.254.169.254/latest/meta-data/')).not.toBeNull()
  })

  it('las formas decimal y octal, que new URL normaliza a punteada', () => {
    expect(blockedTarget('http://2130706433:8080')).not.toBeNull() // 127.0.0.1
    expect(blockedTarget('http://0177.0.0.1:8080')).not.toBeNull() // 127.0.0.1
  })

  it('un nombre publico NO se bloquea aqui: de el se encarga safeLookup', () => {
    expect(blockedTarget('https://ejemplo.com/')).toBeNull()
    expect(blockedTarget('http://93.184.216.34/')).toBeNull()
  })

  it('localhost por nombre tambien cae, por si llega sin pasar por parseTarget', () => {
    expect(blockedTarget('http://localhost:3000')).not.toBeNull()
  })

  it('una URL ilegible se rechaza en vez de intentar conectar a ciegas', () => {
    expect(blockedTarget('no-es-una-url')).not.toBeNull()
    expect(blockedTarget('')).not.toBeNull()
  })
})
