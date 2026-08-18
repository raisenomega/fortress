import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { git } from './merge-repo-fixture'

/** Un repo con un commit: el ancla desde la que colgar worktrees de prueba. */
export function repoConUnCommit(): { dir: string; sha: string } {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-rama-'))
  git(dir, 'init', '-b', 'main')
  git(dir, 'config', 'user.email', 'test@fortress')
  git(dir, 'config', 'user.name', 'test')
  git(dir, 'config', 'commit.gpgsign', 'false')
  writeFileSync(join(dir, 'a.txt'), 'hola\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-m', 'base')
  return { dir, sha: git(dir, 'rev-parse', 'HEAD').trim() }
}
