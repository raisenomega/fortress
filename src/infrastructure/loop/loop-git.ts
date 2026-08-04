import { execFileSync } from 'child_process'

function git(cwd: string, args: readonly string[]): string {
  return execFileSync('git', args as string[], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
}

/**
 * Checkpoint ANTES de reparar: comitea el estado actual y devuelve su sha. Si no
 * es un repo git devuelve null: sin git no hay red de reversion (el loop lo sabe).
 */
export function gitSnapshot(cwd: string): string | null {
  try {
    git(cwd, ['add', '-A'])
    git(cwd, ['commit', '-m', 'loop: checkpoint', '--allow-empty', '--no-verify'])
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
