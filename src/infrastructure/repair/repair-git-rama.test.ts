import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { git as gitSync } from './merge-repo-fixture'
import { repoConUnCommit } from './repair-git-rama-fixture'
import { ramaDelMotor } from './repair-git'

describe('ramaDelMotor: que rama borrar con el worktree', () => {
  it('un worktree del motor dice su rama repair', async () => {
    const { dir, sha } = repoConUnCommit()
    const wt = join(mkdtempSync(join(tmpdir(), 'fcc-wt-')), 'p1')
    gitSync(dir, 'worktree', 'add', '-b', 'repair/p1-lo-que-sea', wt, sha)

    expect(await ramaDelMotor(wt)).toBe('repair/p1-lo-que-sea')
  })

  it('el checkout vivo NO se ofrece: su rama no es del motor', async () => {
    // Sin esto, un `branch -D main` sobre el repo del operador.
    expect(await ramaDelMotor(repoConUnCommit().dir)).toBe('')
  })

  it('un worktree en HEAD suelto no ofrece rama que borrar', async () => {
    const { dir, sha } = repoConUnCommit()
    const wt = join(mkdtempSync(join(tmpdir(), 'fcc-wt-')), 'p2')
    gitSync(dir, 'worktree', 'add', '--detach', wt, sha)

    expect(await ramaDelMotor(wt)).toBe('')
  })

  it('un directorio que no es repo tampoco', async () => {
    expect(await ramaDelMotor(mkdtempSync(join(tmpdir(), 'fcc-nada-')))).toBe('')
  })
})
