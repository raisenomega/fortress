import { readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { createGitMergeApplier } from './git-merge-applier'
import { crearRepo, git } from './merge-repo-fixture'

const repos: string[] = []

function repo(choque: boolean): string {
  const dir = crearRepo(choque)
  repos.push(dir)
  return dir
}

afterEach(() => {
  while (repos.length > 0) rmSync(repos.pop() as string, { recursive: true, force: true })
})

const aplicar = (dir: string): ReturnType<ReturnType<typeof createGitMergeApplier>['apply']> =>
  createGitMergeApplier().apply({
    projectPath: dir,
    sourceBranch: 'fix',
    commitMessage: 'merge: integracion automatica de prueba'
  })

describe('createGitMergeApplier: integra en la rama viva, resuelta y no supuesta', () => {
  it('merge limpio: devuelve el sha del commit y la rama destino real', async () => {
    const dir = repo(false)
    const outcome = await aplicar(dir)
    expect(outcome).toMatchObject({ ok: true, targetBranch: 'main' })
    expect(git(dir, 'rev-parse', 'HEAD').trim()).toBe(
      outcome.ok ? outcome.mergeCommitSha : 'no aplico'
    )
    expect(git(dir, 'log', '-1', '--pretty=%s')).toContain('integracion automatica')
  })

  it('HEAD suelto: no intenta el merge siquiera', async () => {
    const dir = repo(false)
    git(dir, 'checkout', '--detach')
    // `gitOutput` es lo que git CONTESTO: aqui, la palabra HEAD. Distinguir eso
    // de un `sin-caja:` es justo lo que faltaba el 2026-10-01 (DEUDAS §14).
    expect(await aplicar(dir)).toEqual({ ok: false, kind: 'target-branch-detached', gitOutput: 'HEAD' }) // prettier-ignore
  })
})

describe('createGitMergeApplier: un fallo no deja el repo del operador a medias', () => {
  it('conflicto: aborta y el arbol queda EXACTAMENTE como estaba', async () => {
    const dir = repo(true)
    const estadoAntes = git(dir, 'status', '--porcelain')
    const headAntes = git(dir, 'rev-parse', 'HEAD')

    const outcome = await aplicar(dir)

    expect(outcome).toMatchObject({ ok: false, kind: 'conflict' })
    // Sin el --abort del adaptador, aqui quedarian los marcadores del merge.
    expect(git(dir, 'status', '--porcelain')).toBe(estadoAntes)
    expect(git(dir, 'rev-parse', 'HEAD')).toBe(headAntes)
    expect(() => git(dir, 'rev-parse', '--verify', 'MERGE_HEAD')).toThrow()
  })

  it('arbol sucio: git rehusa y el trabajo sin commitear sigue intacto', async () => {
    const dir = repo(false)
    writeFileSync(join(dir, 'a.txt'), 'lo que el operador estaba escribiendo\n')

    expect(await aplicar(dir)).toMatchObject({ ok: false, kind: 'dirty-tree' })
    expect(readFileSync(join(dir, 'a.txt'), 'utf8')).toBe('lo que el operador estaba escribiendo\n')
  })
})
