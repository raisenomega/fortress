import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createGitPusher } from './git-push'
import { gitSnapshot } from './git-snapshot'
import { conRemoto, repoConHook } from './repo-con-hook-fixture'

/**
 * ADR-092, git opcion B: los hooks del cliente NUNCA corren en el git propio de
 * FORTRESS. Dos lanzadores del Terminal se habian escapado: el checkpoint solo
 * pasaba `--no-verify` (que no toca `post-commit`) y el push no apagaba nada
 * (`pre-push` corria con el operador).
 */
describe('el git del Terminal tampoco ejecuta los hooks del cliente', () => {
  it('post-commit del cliente: el checkpoint de gitSnapshot NO lo dispara', () => {
    const { repo, huella } = repoConHook('post-commit')
    expect(gitSnapshot(repo, 'checkpoint')).toMatch(/^[0-9a-f]{40}$/)
    expect(existsSync(huella)).toBe(false)
  })

  it('pre-push del cliente: el push de FORTRESS NO lo dispara', async () => {
    const { repo, huella } = repoConHook('pre-push')
    conRemoto(repo)
    const r = await createGitPusher().push(repo)
    expect(r.ok).toBe(true)
    expect(existsSync(huella)).toBe(false)
  })

  it('las huellas SI aparecen con git a pelo: los tests tienen dientes', () => {
    const c = repoConHook('post-commit')
    execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'x'], { cwd: c.repo })
    expect(existsSync(c.huella)).toBe(true)
    const p = repoConHook('pre-push')
    conRemoto(p.repo)
    execFileSync('git', ['push', '-q'], { cwd: p.repo })
    expect(existsSync(p.huella)).toBe(true)
  })
})
