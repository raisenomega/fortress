import { describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import type { GitIdentitySetter, GitRemoteSetter } from '@domain/project/git-config-setter'
import { err, ok } from '@domain/shared/result'
import { setProjectIdentity, setProjectRemote } from './set-git-config'

/** PASO 165: set-remote actualiza TAMBIÉN la caché `projects.git_remote`, en la
 *  misma operación, SOLO si el adaptador tuvo éxito (la caché sigue a la verdad).
 *  Test PURO de la orquestación: repo FALSO (la capa aplicación no toca infra). */
const VIEJO = 'https://github.com/jorge8674/old.git'
const NUEVO = 'https://github.com/raisenomega/health.git'
const okRemote: GitRemoteSetter = { setRemote: () => ok('ok') }
const failRemote: GitRemoteSetter = { setRemote: () => err('no es raíz') }
const okIdentity: GitIdentitySetter = { setIdentity: () => ok('ok') }

function contexto(): { ctx: AppContext; cache: () => string } {
  let remoto = VIEJO
  const projects = {
    findById: (id: string) => (id === 'p1' ? { id, path: '/tmp/hf-165', gitRemote: remoto } : null),
    setGitRemote: (_id: string, url: string) => {
      remoto = url
    }
  }
  return { ctx: { projects } as unknown as AppContext, cache: () => remoto }
}

describe('set-remote sincroniza la caché (PASO 165)', () => {
  it('T1: tras set-remote OK, la caché queda en la URL nueva', () => {
    const { ctx, cache } = contexto()
    expect(setProjectRemote(ctx, okRemote, 'p1', NUEVO).ok).toBe(true)
    expect(cache()).toBe(NUEVO)
  })

  it('T2: si el adaptador FALLA, la caché NO se toca (sigue a la verdad)', () => {
    const { ctx, cache } = contexto()
    expect(setProjectRemote(ctx, failRemote, 'p1', NUEVO).ok).toBe(false)
    expect(cache()).toBe(VIEJO)
  })

  it('T3: set-identity NO toca la caché del remoto', () => {
    const { ctx, cache } = contexto()
    setProjectIdentity(ctx, okIdentity, 'p1', 'N', 'e@x.z')
    expect(cache()).toBe(VIEJO)
  })
})
