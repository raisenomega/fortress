import { describe, expect, it } from 'vitest'
import { esUrlDeRemoto } from './git-remote-url'

/** PASO 163 (Sello 2a): un remoto git es https(s), ssh:// o `git@host:ruta`.
 *  Lo que no parsea como eso —vacío, basura, file://— no se fija como remoto. */
describe('esUrlDeRemoto', () => {
  it('acepta https y ssh (dos formas)', () => {
    expect(esUrlDeRemoto('https://github.com/raisenomega/health.git')).toBe(true)
    expect(esUrlDeRemoto('http://example.com/a.git')).toBe(true)
    expect(esUrlDeRemoto('git@github.com:raisenomega/health.git')).toBe(true)
    expect(esUrlDeRemoto('ssh://git@host.com/a/b.git')).toBe(true)
  })

  it('rechaza vacío, espacios, basura y esquemas peligrosos', () => {
    expect(esUrlDeRemoto('')).toBe(false)
    expect(esUrlDeRemoto('   ')).toBe(false)
    expect(esUrlDeRemoto('no-es-url')).toBe(false)
    expect(esUrlDeRemoto('file:///etc/passwd')).toBe(false)
  })
})
