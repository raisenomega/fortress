import { describe, expect, it, vi } from 'vitest'
import { AL_CARGAR_SIN_CAJA, conPath, repoDeUnUso } from './merge-sin-caja-fixture'

type Git = (typeof import('./git-del-merge'))['git']

/** Carga el modulo del merge con un PATH dado y lo devuelve ya con el de verdad:
 *  exactamente la asimetria del arranque de la app, donde los imports se evaluan
 *  antes de que `augmentPath()` complete el PATH. */
async function gitCargadoCon(pathAlCargar: string): Promise<Git> {
  const real = process.env.PATH
  process.env.PATH = pathAlCargar
  vi.resetModules()
  const mod = await import('./git-del-merge')
  process.env.PATH = real
  return mod.git
}

describe('el entorno del merge se compone AL LLAMAR, no al cargar el modulo', () => {
  it('un PATH sin caja al cargar no condena el merge: al llamar ya esta completo', async () => {
    const git = await gitCargadoCon(AL_CARGAR_SIN_CAJA)
    const repo = repoDeUnUso()
    try {
      const r = await git(repo.dir, ['rev-parse', '--abbrev-ref', 'HEAD'])
      expect(r.fallo).toBe(false)
      expect(r.salida).toBe('main')
    } finally {
      repo.borrar()
    }
  })

  it('y al reves: manda el PATH del MOMENTO, no el que hubiera al cargar', async () => {
    const git = await gitCargadoCon(process.env.PATH ?? '')
    const repo = repoDeUnUso()
    try {
      const r = await conPath(AL_CARGAR_SIN_CAJA, () =>
        git(repo.dir, ['rev-parse', '--abbrev-ref', 'HEAD'])
      )
      expect(r.fallo).toBe(true)
      expect(r.salida).toMatch(/^sin-caja:/)
    } finally {
      repo.borrar()
    }
  })
})
