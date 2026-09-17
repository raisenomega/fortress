import { execFileSync } from 'child_process'
import { resolve } from 'path'

export function git(cwd: string, args: readonly string[]): string {
  return execFileSync('git', args as string[], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  })
}

/**
 * La carpeta debe ser la RAIZ de su propio repo. Si es una subcarpeta de un repo
 * padre, git operaria sobre el padre entero: un `add -A` / `reset --hard` ahi
 * podria destruir trabajo ajeno. En ese caso se trata como "sin red git".
 */
export function isRepoRoot(cwd: string): boolean {
  try {
    return resolve(git(cwd, ['rev-parse', '--show-toplevel']).trim()) === resolve(cwd)
  } catch {
    return false
  }
}

/**
 * Checkpoint ANTES de editar: comitea el estado actual y devuelve su sha. Si no
 * es la raiz de un repo git devuelve null: sin red de reversion, y quien la abre lo sabe.
 */
export function gitSnapshot(cwd: string, message = 'checkpoint'): string | null {
  if (!isRepoRoot(cwd)) return null
  try {
    git(cwd, ['add', '-A'])
    git(cwd, ['commit', '-m', message, '--allow-empty', '--no-verify'])
    return git(cwd, ['rev-parse', 'HEAD']).trim()
  } catch {
    return null
  }
}

/** Revierte al checkpoint: descarta TODO lo que el arreglo dejo (incluido lo roto). */
export function gitRevert(cwd: string, sha: string): void {
  try {
    git(cwd, ['reset', '--hard', sha])
  } catch {
    // Mejor esfuerzo: si git falla, no hay mas que hacer aqui.
  }
}
