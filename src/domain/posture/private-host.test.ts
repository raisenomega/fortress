import { describe, expect, it } from 'vitest'
import { isPrivateHost } from './private-host'

describe('isPrivateHost', () => {
  it('bloquea loopback, privadas, link-local y metadatos de la nube', () => {
    const blocked = [
      'localhost',
      'db.local',
      '127.0.0.1',
      '10.1.2.3',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.1',
      '169.254.169.254',
      '0.0.0.0',
      '::1',
      'fe80::1',
      'fd00::1'
    ]
    for (const host of blocked) expect(isPrivateHost(host), host).toBe(true)
  })

  it('deja pasar direcciones publicas', () => {
    const ok = ['example.com', 'raisen.agency', '8.8.8.8', '172.32.0.1', '11.0.0.1']
    for (const host of ok) expect(isPrivateHost(host), host).toBe(false)
  })
})
