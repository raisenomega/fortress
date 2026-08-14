import { execFileSync } from 'child_process'
import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

/** git de verdad contra un repo de verdad: el estado que deja es el objeto de la prueba. */
export function git(dir: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8' })
}

/**
 * Un repo con `main` y una rama `fix` que la toca. Con `choque`, ambas cambian
 * la misma linea y el merge conflictua sin remedio; sin el, entra limpio.
 */
export function crearRepo(choque: boolean): string {
  const dir = mkdtempSync(join(tmpdir(), 'fortress-merge-'))
  const escribir = (texto: string): void => writeFileSync(join(dir, 'a.txt'), texto)
  git(dir, 'init', '-b', 'main')
  git(dir, 'config', 'user.email', 'test@fortress')
  git(dir, 'config', 'user.name', 'test')
  git(dir, 'config', 'commit.gpgsign', 'false')

  escribir('base\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-m', 'base')

  git(dir, 'checkout', '-b', 'fix')
  escribir('fix\n')
  git(dir, 'commit', '-am', 'fix')

  git(dir, 'checkout', 'main')
  if (choque) {
    escribir('otro\n')
    git(dir, 'commit', '-am', 'otro')
  }
  return dir
}
