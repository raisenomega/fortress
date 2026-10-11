import { execFileSync } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createGitRemoteSetter } from './git-remote'
import { cfgDe, homeAislado, repoTemporal } from './git-config-fixture'

/** PASO 163 (Sello 2a): fijar el remoto de un proyecto DESDE FORTRESS, sobre
 *  repos TEMPORALES. Health Flow NO se toca. */
const remoto = createGitRemoteSetter()
const VIEJO = 'https://github.com/jorge8674/Health-Flow-Refact-A.5.git'
const NUEVO = 'https://github.com/raisenomega/health.git'
let homeReal: string | undefined
beforeAll(() => {
  homeReal = homeAislado()
})
afterAll(() => {
  if (homeReal !== undefined) process.env.HOME = homeReal
})

describe('setRemoto', () => {
  it('T3: crea origin si falta, lo cambia si existe, idempotente', () => {
    const dir = repoTemporal()
    expect(remoto.setRemote(dir, NUEVO).ok).toBe(true)
    expect(cfgDe(dir, 'remote.origin.url')).toBe(NUEVO)
    expect(remoto.setRemote(dir, NUEVO).ok).toBe(true)
    expect(cfgDe(dir, 'remote.origin.url')).toBe(NUEVO)

    const dir2 = repoTemporal()
    execFileSync('git', ['remote', 'add', 'origin', VIEJO], { cwd: dir2 })
    expect(remoto.setRemote(dir2, NUEVO).ok).toBe(true)
    expect(cfgDe(dir2, 'remote.origin.url')).toBe(NUEVO)
  })

  it('T4: URL vacía/inválida rechaza; directorio no-raíz-de-repo rechaza', () => {
    const dir = repoTemporal()
    expect(remoto.setRemote(dir, '').ok).toBe(false)
    expect(remoto.setRemote(dir, 'no-es-url').ok).toBe(false)
    expect(remoto.setRemote('/tmp', NUEVO).ok).toBe(false)
  })
})
