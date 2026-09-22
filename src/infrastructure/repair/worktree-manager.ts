import { existsSync, mkdirSync } from 'node:fs'
import { rmdirSiVacio } from './directorio-vacio'
import { git, lastLine, porcelainFiles, shortstat } from './repair-git'

export interface WorktreeDiff {
  readonly files: readonly string[]
  readonly insertions: number
  readonly deletions: number
}

/** Puerto de los worktrees del motor. Todo git por args array; nada de shell. */
export interface WorktreeManager {
  create(baseSha: string, projectRepoPath: string, worktreePath: string, branchName: string): Promise<{ ok: true } | { ok: false; error: string }> // prettier-ignore
  /** --force y rama fuera; mejor esfuerzo: limpiar no puede romper nada. */
  remove(worktreePath: string, branchName: string, projectRepoPath: string): Promise<void>
  isClean(worktreePath: string): Promise<boolean>
  hasChanges(worktreePath: string): Promise<boolean>
  /** Tocados segun status --porcelain: INCLUYE untracked (un test nuevo cuenta). */
  changedFiles(worktreePath: string): Promise<string[]>
  /** Post-commit: lo que separa a HEAD del ancla, para la evidencia del libro. */
  diff(worktreePath: string, baseSha: string): Promise<WorktreeDiff>
  commit(worktreePath: string, message: string): Promise<{ ok: true; sha: string } | { ok: false; error: string }> // prettier-ignore
}

export function createWorktreeManager(): WorktreeManager {
  const status = (worktreePath: string): Promise<{ code: number; out: string }> =>
    git(worktreePath, ['status', '--porcelain'])

  return {
    create: async (baseSha, projectRepoPath, worktreePath, branchName) => {
      // El destino vive FUERA del repo: se crea aqui, vacio, y se monta en
      // escritura dentro de la caja; si no, el checkout cae en su tmpfs (ADR-092).
      mkdirSync(worktreePath, { recursive: true })
      const result = await git(projectRepoPath, ['worktree', 'add', '-b', branchName, worktreePath, baseSha], [worktreePath]) // prettier-ignore
      if (result.code !== 0) rmdirSiVacio(worktreePath)
      return result.code === 0 ? { ok: true } : { ok: false, error: lastLine(result.out) }
    },
    remove: async (worktreePath, branchName, projectRepoPath) => {
      // Dentro de la caja el destino es un punto de montaje: git vacia su
      // contenido pero no puede quitar el directorio; eso se hace aqui, fuera.
      const montar = existsSync(worktreePath) ? [worktreePath] : []
      await git(projectRepoPath, ['worktree', 'remove', '--force', worktreePath], montar)
      rmdirSiVacio(worktreePath)
      if (branchName !== '') await git(projectRepoPath, ['branch', '-D', branchName])
    },
    isClean: async (worktreePath) => {
      const result = await status(worktreePath)
      return result.code === 0 && result.out.trim() === ''
    },
    hasChanges: async (worktreePath) => {
      const result = await status(worktreePath)
      return result.code === 0 && result.out.trim() !== ''
    },
    changedFiles: async (worktreePath) => porcelainFiles((await status(worktreePath)).out),
    diff: async (worktreePath, baseSha) => {
      const names = await git(worktreePath, ['diff', '--name-only', baseSha, 'HEAD'])
      const stat = await git(worktreePath, ['diff', '--shortstat', baseSha, 'HEAD'])
      return {
        files: names.out.split('\n').filter((line) => line.trim() !== ''),
        ...shortstat(stat.out)
      }
    },
    commit: async (worktreePath, message) => {
      await git(worktreePath, ['add', '-A'])
      const result = await git(worktreePath, ['commit', '-m', message, '--no-verify'])
      if (result.code !== 0) return { ok: false, error: lastLine(result.out) }
      const sha = await git(worktreePath, ['rev-parse', 'HEAD'])
      return { ok: true, sha: sha.out.trim() }
    }
  }
}
