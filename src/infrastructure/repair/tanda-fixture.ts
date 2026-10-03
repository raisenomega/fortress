import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { git } from './merge-repo-fixture'
import type { MiembroDeTanda } from './sonda-de-la-tanda'

/**
 * La forma EXACTA del 2-oct (dde8e100 + ccb969e6): dos propuestas que no
 * comparten fichero —una trae el juez, la otra el juzgado— y un gate que solo
 * rompe cuando las dos estan en el arbol A LA VEZ. Verdes por separado, rojas
 * juntas: lo que `ficherosEnComun` no puede ver.
 */
export function npmQueRompeConElPar(): string {
  const bin = join(mkdtempSync(join(tmpdir(), 'fcc-tanda-npm-')), 'npm')
  writeFileSync(bin, '#!/bin/sh\n[ "$2" = "test:unit" ] && [ -f juez.ts ] && [ -f juzgado.ts ] && exit 1\nexit 0\n') // prettier-ignore
  chmodSync(bin, 0o755)
  return bin
}

export interface EscenarioDeTanda {
  readonly repo: string
  readonly miembros: readonly MiembroDeTanda[]
}

/** Un repo y N propuestas en cola, cada una con su worktree y su rama, cada
 *  una anadiendo SU fichero: sin ficheros comunes entre ellas. */
export function escenarioDeTanda(...ficheros: readonly string[]): EscenarioDeTanda {
  const repo = mkdtempSync(join(tmpdir(), 'fcc-tanda-'))
  git(repo, 'init', '-b', 'main')
  git(repo, 'config', 'user.email', 'test@fortress')
  git(repo, 'config', 'user.name', 'test')
  git(repo, 'config', 'commit.gpgsign', 'false')
  const scripts = { typecheck: 'true', lint: 'true', 'test:unit': 'true' }
  writeFileSync(join(repo, 'package.json'), JSON.stringify({ scripts }))
  writeFileSync(join(repo, 'base.ts'), 'base\n')
  git(repo, 'add', '.')
  git(repo, 'commit', '-m', 'base')
  const baseSha = git(repo, 'rev-parse', 'HEAD').trim()

  const miembros = ficheros.map((fichero, i) => {
    const id = `p-${i + 1}`
    const branch = `repair/${id}`
    const worktreePath = join(mkdtempSync(join(tmpdir(), 'fcc-tanda-wt-')), id)
    git(repo, 'worktree', 'add', '-b', branch, worktreePath, baseSha)
    writeFileSync(join(worktreePath, fichero), 'fix\n')
    git(worktreePath, 'add', '.')
    git(worktreePath, 'commit', '-m', `fix ${id}`)
    return { id, worktreePath, branch }
  })
  return { repo, miembros }
}
