import { execFileSync } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createGitIdentitySetter } from './git-identity'
import { redDisponible } from './checkpoint-transitorio'
import { cfgDe, homeAislado, repoTemporal } from './git-config-fixture'

/** PASO 163 (Sello 2a): fijar la identidad git de un proyecto DESDE FORTRESS,
 *  sobre repos TEMPORALES. Health Flow NO se toca. */
const identidad = createGitIdentitySetter()
let homeReal: string | undefined
beforeAll(() => {
  homeReal = homeAislado()
})
afterAll(() => {
  if (homeReal !== undefined) process.env.HOME = homeReal
})

describe('setIdentidad', () => {
  it('T1: fija user.name/email LOCAL; GIT_COMMITTER_IDENT deja de salir 128', () => {
    const dir = repoTemporal()
    const r = identidad.setIdentity(dir, 'Health Flow Bot', 'bot@health.local')
    expect(r.ok).toBe(true)
    expect(cfgDe(dir, 'user.name')).toBe('Health Flow Bot')
    expect(cfgDe(dir, 'user.email')).toBe('bot@health.local')
    expect(() => execFileSync('git', ['var', 'GIT_COMMITTER_IDENT'], { cwd: dir })).not.toThrow()
  })

  it('T2: redDisponible pasa de false a true al fijar identidad (chequeo existente)', () => {
    const dir = repoTemporal(true)
    expect(redDisponible(dir)).toBe(false)
    identidad.setIdentity(dir, 'Health Flow Bot', 'bot@health.local')
    expect(redDisponible(dir)).toBe(true)
  })

  it('T5: identidad LOCAL, NUNCA el ~/.gitconfig global; T4: no-raíz rechaza', () => {
    const dir = repoTemporal()
    identidad.setIdentity(dir, 'Health Flow Bot', 'bot@health.local')
    expect(cfgDe(dir, 'user.name', '--global')).toBe('')
    expect(cfgDe(dir, 'user.name')).toBe('Health Flow Bot')
    expect(identidad.setIdentity('/tmp', 'X', 'x@y.z').ok).toBe(false)
  })
})
