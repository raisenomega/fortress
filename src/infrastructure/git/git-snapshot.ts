import { execFileSync } from 'child_process'
import { resolve } from 'path'
import { SIN_HOOKS } from '../sandbox/git-sin-hooks'

/** LISTA BLANCA desde `{}`, como `entornoDelMerge`, y no el recorte de `gitEnv`:
 *  ese deja pasar tokens de terceros y cualquier `GIT_*` heredado (`GIT_DIR`,
 *  `GIT_CONFIG_*`, `GIT_EXEC_PATH`). HOME va real: el checkpoint corre fuera de
 *  la caja y su identidad sale de `~/.gitconfig`. Sin `LC_ALL=C`: la salida se
 *  le ensena al operador. Se compone AL LLAMAR, nunca al cargar (DEUDAS §14). */
const COPIADAS: readonly string[] = ['PATH', 'HOME', 'TMPDIR', 'LANG', 'LC_ALL', 'EMAIL']
const IDENTIDAD: readonly string[] = ['GIT_AUTHOR_NAME', 'GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_NAME', 'GIT_COMMITTER_EMAIL'] // prettier-ignore

function entornoDelCheckpoint(): NodeJS.ProcessEnv {
  const env: Record<string, string> = {}
  for (const clave of [...COPIADAS, ...IDENTIDAD]) {
    const valor = process.env[clave]
    if (valor !== undefined) env[clave] = valor
  }
  return { ...env, GIT_TERMINAL_PROMPT: '0' }
}

/** El git del Terminal, sin los hooks del cliente (ADR-092, git opcion B): el
 *  checkpoint comitea en el arbol vivo, y `--no-verify` no apaga `post-commit`.
 *  Con el entorno acotado (ADR-095 §4.1): los filtros clean/textconv del repo
 *  auditado no ven la sesion ni los secretos del operador. */
export function git(cwd: string, args: readonly string[]): string {
  return execFileSync('git', [...SIN_HOOKS, ...args], {
    cwd,
    env: entornoDelCheckpoint(),
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
