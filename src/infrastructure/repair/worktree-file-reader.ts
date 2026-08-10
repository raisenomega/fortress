import { readFileSync } from 'fs'
import { join } from 'path'
import { git } from './repair-git'

/**
 * Lecturas que OMEGA necesita para juzgar: el archivo como quedo (post-fix),
 * el archivo como estaba (pre-fix, en base_sha) y el diff textual del commit.
 * readAtHead lee el DISCO del worktree: run-omega ya verifico isClean, asi que
 * disco == HEAD; git no hace falta para el post.
 */
export function readAtHead(worktreePath: string, relPath: string): string {
  try {
    return readFileSync(join(worktreePath, relPath), 'utf8')
  } catch {
    return ''
  }
}

/** El archivo en base_sha, via `git show sha:path` sobre el worktree (comparte
 *  object store con el repo). Un archivo NUEVO no existia en base: '' honesto. */
export async function readAtSha(repoPath: string, sha: string, relPath: string): Promise<string> {
  const result = await git(repoPath, ['show', `${sha}:${relPath}`])
  return result.code === 0 ? result.out : ''
}

/** El diff completo del commit del fix, como texto para el prompt de OMEGA. */
export async function showHead(worktreePath: string): Promise<string> {
  const result = await git(worktreePath, ['show', 'HEAD', '--format=commit %h %s'])
  return result.code === 0 ? result.out : ''
}
