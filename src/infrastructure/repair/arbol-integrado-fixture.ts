import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { git } from './merge-repo-fixture'

/** npm falso que falla EL comando que se le diga y ninguno mas: asi la prueba
 *  distingue "corrio y rompio en lint" de "no llego a correr". */
export function npmQueFalla(rojo: string): string {
  const bin = join(mkdtempSync(join(tmpdir(), 'fcc-arb-npm-')), 'npm')
  writeFileSync(bin, `#!/bin/sh\n[ "$2" = "${rojo}" ] && exit 1\nexit 0\n`)
  chmodSync(bin, 0o755)
  return bin
}

export interface Escenario {
  readonly repo: string
  readonly worktree: string
  readonly baseSha: string
}

/**
 * Un repo cuyo main YA se movio y un worktree del motor anclado a la base: la
 * forma exacta del 5 de septiembre. `fixEn` y `destinoEn` deciden si los dos
 * lados tocan el mismo fichero, que es lo unico que cambia entre un choque
 * textual —que git ve— y uno semantico —que no—.
 */
export function escenario(fixEn: string, destinoEn: string): Escenario {
  const repo = mkdtempSync(join(tmpdir(), 'fcc-arb-'))
  git(repo, 'init', '-b', 'main')
  git(repo, 'config', 'user.email', 'test@fortress')
  git(repo, 'config', 'user.name', 'test')
  git(repo, 'config', 'commit.gpgsign', 'false')
  const scripts = { typecheck: 'true', lint: 'true', 'test:unit': 'true' }
  writeFileSync(join(repo, 'package.json'), JSON.stringify({ scripts }))
  writeFileSync(join(repo, 'a.ts'), 'base\n')
  writeFileSync(join(repo, 'b.ts'), 'base\n')
  git(repo, 'add', '.')
  git(repo, 'commit', '-m', 'base')
  const baseSha = git(repo, 'rev-parse', 'HEAD').trim()

  const worktree = join(mkdtempSync(join(tmpdir(), 'fcc-arb-wt-')), 'p-1')
  git(repo, 'worktree', 'add', '-b', 'repair/p-1', worktree, baseSha)
  writeFileSync(join(worktree, fixEn), 'fix\n')
  git(worktree, 'add', '.')
  git(worktree, 'commit', '-m', 'fix')

  writeFileSync(join(repo, destinoEn), 'destino\n')
  git(repo, 'add', '.')
  git(repo, 'commit', '-m', 'destino')
  return { repo, worktree, baseSha }
}
