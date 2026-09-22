import { afterAll, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { git } from './repair-git'
import { git as gitDelMerge } from './git-del-merge'
import { limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { repoConHook } from '../git/repo-con-hook-fixture'

afterAll(limpiarCarpetasDePrueba)

describe('el git de FORTRESS no ejecuta los hooks del repo auditado (ADR-092, git opcion B)', () => {
  it('post-checkout del cliente: `git checkout` de repair-git NO lo dispara', async () => {
    const { repo, huella } = repoConHook('post-checkout')
    const out = await git(repo, ['checkout', '-q', '-b', 'rama-del-motor'])
    expect(out.code).toBe(0)
    expect(existsSync(huella)).toBe(false)
  })

  it('post-merge del cliente: el merge de FORTRESS NO lo dispara', async () => {
    const { repo, huella } = repoConHook('post-merge')
    await git(repo, ['checkout', '-q', '-b', 'fix'])
    writeFileSync(join(repo, 'b.txt'), 'b')
    await git(repo, ['add', 'b.txt'])
    await git(repo, ['commit', '-q', '-m', 'fix', '--no-verify'])
    await git(repo, ['checkout', '-q', 'main'])
    const merge = await gitDelMerge(repo, ['merge', '--no-ff', 'fix', '-m', 'merge'])
    expect(merge.fallo).toBe(false)
    expect(existsSync(huella)).toBe(false)
  })

  it('la huella SI aparece cuando git corre con sus hooks: el test tiene dientes', () => {
    const { repo, huella } = repoConHook('post-checkout')
    execFileSync('git', ['checkout', '-q', '-b', 'x'], { cwd: repo })
    expect(existsSync(huella)).toBe(true)
  })
})
