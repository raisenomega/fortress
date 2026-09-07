import { execFileSync } from 'child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

/**
 * Repos git de verdad en /tmp, creados DENTRO del test — nunca la base del
 * operador ni ninguno de sus repos. El mecanismo que se prueba es git; contra
 * un doble no se probaria nada.
 */
export function git(dir: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) // prettier-ignore
}

/** Un repo con un unico commit `base` y un fichero `a.txt` con `base\n`. */
export function crearRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fortress-checkpoint-'))
  git(dir, 'init', '-b', 'main')
  git(dir, 'config', 'user.email', 'test@fortress')
  git(dir, 'config', 'user.name', 'test')
  git(dir, 'config', 'commit.gpgsign', 'false')
  escribir(dir, 'a.txt', 'base\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-m', 'base')
  return dir
}

/** `git init` sin ningun commit: la rama esta sin nacer. */
export function crearRepoSinHistoria(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fortress-checkpoint-vacio-'))
  git(dir, 'init', '-b', 'main')
  return dir
}

export function crearCarpetaSinGit(): string {
  return mkdtempSync(join(tmpdir(), 'fortress-checkpoint-sin-git-'))
}

/** Una subcarpeta dentro de un repo: no es la raiz, y eso es lo que se prueba. */
export function subcarpeta(dir: string): string {
  const sub = join(dir, 'sub')
  mkdirSync(sub)
  return sub
}

export const escribir = (dir: string, fichero: string, texto: string): void =>
  writeFileSync(join(dir, fichero), texto)
export const leer = (dir: string, fichero: string): string =>
  readFileSync(join(dir, fichero), 'utf8')
export const existe = (dir: string, fichero: string): boolean => existsSync(join(dir, fichero))

/** Los asuntos del historial, del mas reciente al mas viejo. */
export const asuntos = (dir: string): string[] => git(dir, 'log', '--format=%s').trim().split('\n')
export const head = (dir: string): string => git(dir, 'rev-parse', 'HEAD').trim()
export const porcelain = (dir: string): string => git(dir, 'status', '--porcelain')

export function limpiar(dirs: string[]): void {
  while (dirs.length > 0) rmSync(dirs.pop() as string, { recursive: true, force: true })
}
