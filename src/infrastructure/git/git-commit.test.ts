import { chmodSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { gitCommit } from './git-commit'
import { asuntos, crearRepo, escribir, existe, git, leer, limpiar } from './checkpoint-fixture'

const dirs: string[] = []
/** Una carpeta reutilizada: un repo que ya existia, con su historia y su config. */
const reutilizada = (): string => {
  const dir = crearRepo()
  dirs.push(dir)
  return dir
}
afterEach(() => limpiar(dirs))

const HOOKS = ['pre-commit', 'prepare-commit-msg', 'commit-msg', 'post-commit', 'post-index-change']

/**
 * Cada hook deja su nombre en `testigo` (en la raiz del arbol, donde git los
 * corre) y falla, como un lint-staged o un commitlint que no pasan.
 */
function armarHooks(carpeta: string): void {
  mkdirSync(carpeta, { recursive: true })
  for (const hook of HOOKS) {
    writeFileSync(join(carpeta, hook), `#!/bin/sh\necho ${hook} >> testigo\nexit 1\n`)
    chmodSync(join(carpeta, hook), 0o755)
  }
}

const testigo = (dir: string): string => (existe(dir, 'testigo') ? leer(dir, 'testigo') : '')

/** Lo que hace governance-writer: escribe un documento del marco y lo commitea. */
async function commitearMarco(dir: string): Promise<void> {
  escribir(dir, 'CLAUDE.md', 'marco\n')
  const r = await gitCommit(dir, ['CLAUDE.md'], 'marco de gobierno')
  // Con solo `--no-verify`, prepare-commit-msg sigue corriendo y tumba el commit.
  expect(r).toMatchObject({ ok: true })
  expect(asuntos(dir)[0]).toBe('marco de gobierno')
  // Con el apagado solo en el commit, el add dispara post-index-change.
  expect(testigo(dir)).toBe('')
}

describe('gitCommit en una carpeta reutilizada no corre el codigo del repo', () => {
  it('los hooks de .git/hooks no corren: ni en el add ni en el commit', async () => {
    const dir = reutilizada()
    armarHooks(join(dir, '.git', 'hooks'))

    await commitearMarco(dir)
  })

  it('un core.hooksPath en la config del repo, como el de husky, tampoco gana', async () => {
    const dir = reutilizada()
    armarHooks(join(dir, '.husky'))
    git(dir, 'config', 'core.hooksPath', '.husky')

    await commitearMarco(dir)

    // Control: la trampa estaba armada. La config del repo gana a la global,
    // asi que un commit normal SI lo tumba el pre-commit, en cualquier maquina.
    expect(() => git(dir, 'commit', '--allow-empty', '-m', 'control')).toThrow()
    expect(testigo(dir)).toContain('pre-commit')
  })
})
