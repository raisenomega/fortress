import { describe, expect, it } from 'vitest'
import { aIpv4Punteada } from './ipv4-formas'

describe('las formas de escribir una IPv4 que el sistema acepta', () => {
  it.each([
    ['127.0.0.1', '127.0.0.1'],
    ['2130706433', '127.0.0.1'],
    ['0x7f000001', '127.0.0.1'],
    ['0177.0.0.1', '127.0.0.1'],
    ['127.1', '127.0.0.1'],
    ['0x7f.0.0.1', '127.0.0.1'],
    ['2852039166', '169.254.169.254'],
    ['192.168.1.1', '192.168.1.1']
  ])('%s es %s', (raw, esperado) => {
    expect(aIpv4Punteada(raw)).toBe(esperado)
  })

  it.each(['ejemplo.com', 'a.b.c.d', '1.2.3.4.5', '256.1.1.1', '', '09.1.1.1', '::1'])(
    '%s no es una IPv4',
    (raw) => {
      expect(aIpv4Punteada(raw)).toBeNull()
    }
  )
})
