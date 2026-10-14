import { describe, expect, it } from 'vitest'
import { sinEjecucionGit } from './sin-ejecucion-git'

describe('las superficies de ejecucion del .git van en SOLO LECTURA', () => {
  it('sin ningun .git no monta nada', () => {
    expect(sinEjecucionGit([])).toEqual([])
  })

  it('recapa hooks/ y config en ro-bind, e info/ con -try: el orden es ENCIMA', () => {
    expect(sinEjecucionGit(['/repo/.git'])).toEqual([
      '--ro-bind',
      '/repo/.git/hooks',
      '/repo/.git/hooks',
      '--ro-bind',
      '/repo/.git/config',
      '/repo/.git/config',
      '--ro-bind-try',
      '/repo/.git/info',
      '/repo/.git/info'
    ])
  })

  it('hooks y config NUNCA salen en escritura: ni --bind ni --ro-bind-try', () => {
    const f = sinEjecucionGit(['/repo/.git'])
    expect(f.filter((x) => x === '--bind')).toEqual([])
    const i = f.indexOf('/repo/.git/hooks')
    expect(f[i - 1]).toBe('--ro-bind')
    const j = f.indexOf('/repo/.git/config')
    expect(f[j - 1]).toBe('--ro-bind')
  })

  it('cada .git declarado lleva sus tres rutas', () => {
    const f = sinEjecucionGit(['/a/.git', '/b/.git'])
    expect(f.filter((x) => x === '--ro-bind')).toHaveLength(4)
    expect(f.filter((x) => x === '--ro-bind-try')).toHaveLength(2)
    expect(f).toContain('/b/.git/config')
  })
})
