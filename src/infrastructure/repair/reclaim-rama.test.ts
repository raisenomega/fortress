import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { git as gitSync } from './merge-repo-fixture'
import { repoConUnCommit } from './repair-git-rama-fixture'
import { ramaDelMotor } from './repair-git'
import { createWorktreeManager } from './worktree-manager'

describe('la limpieza se lleva la rama, no solo el worktree', () => {
  const ramas = (dir: string): string[] =>
    gitSync(dir, 'branch', '--list', 'repair/*')
      .split('\n')
      // git marca con `*` la rama del checkout y con `+` la de otro worktree.
      .map((linea) => linea.replace(/^[*+]/, '').trim())
      .filter((linea) => linea !== '')

  it('borrar el worktree de una propuesta muerta deja cero ramas repair', async () => {
    const { dir, sha } = repoConUnCommit()
    const wt = join(mkdtempSync(join(tmpdir(), 'fcc-wt-')), 'p3')
    gitSync(dir, 'worktree', 'add', '-b', 'repair/p3-muerta', wt, sha)
    expect(ramas(dir)).toEqual(['repair/p3-muerta'])

    // La composicion exacta que hace el reclaim: leer la rama y pasarsela.
    await createWorktreeManager().remove(wt, await ramaDelMotor(wt), dir)

    expect(ramas(dir)).toEqual([])
    expect(gitSync(dir, 'worktree', 'list')).not.toContain('p3')
  })

  it('sin nombre de rama el worktree se va y la rama se queda: el defecto de antes', async () => {
    const { dir, sha } = repoConUnCommit()
    const wt = join(mkdtempSync(join(tmpdir(), 'fcc-wt-')), 'p4')
    gitSync(dir, 'worktree', 'add', '-b', 'repair/p4-huerfana', wt, sha)

    await createWorktreeManager().remove(wt, '', dir)

    expect(ramas(dir)).toEqual(['repair/p4-huerfana'])
  })
})
