import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { git } from './repair-git'
import { git as gitDelMerge } from './git-del-merge'

/** Un repo REAL bajo el HOME con un hook del «cliente» que deja huella si corre.
 *  Bajo el HOME y no en /tmp: /tmp es un tmpfs dentro de la caja. */
function repoConHook(hook: string): { repo: string; huella: string } {
  const repo = mkdtempSync(join(homedir(), '.fortress-hooks-test-'))
  const g = (...a: string[]): string => execFileSync('git', a, { cwd: repo, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }) // prettier-ignore
  g('init', '-q', '-b', 'main')
  g('config', 'user.email', 't@t')
  g('config', 'user.name', 't')
  writeFileSync(join(repo, 'a.txt'), 'a')
  g('add', 'a.txt')
  g('commit', '-q', '-m', 'base')
  const huella = join(repo, 'HUELLA-DEL-HOOK')
  mkdirSync(join(repo, '.git', 'hooks'), { recursive: true })
  writeFileSync(join(repo, '.git', 'hooks', hook), `#!/bin/sh\ntouch "${huella}"\n`, {
    mode: 0o755
  })
  return { repo, huella }
}

describe('el git de FORTRESS no ejecuta los hooks del repo auditado (ADR-092, git opcion B)', () => {
  it('post-checkout del cliente: `git checkout` de repair-git NO lo dispara', async () => {
    const { repo, huella } = repoConHook('post-checkout')
    const out = await git(repo, ['checkout', '-q', '-b', 'rama-del-motor'])
    expect(out.code).toBe(0)
    expect(existsSync(huella)).toBe(false)
  })

  it('post-merge del cliente: el merge de FORTRESS NO lo dispara', async () => {
    const { repo, huella } = repoConHook('post-merge')
    await git(repo, ['checkout', '-q', '-b', 'fix'])
    writeFileSync(join(repo, 'b.txt'), 'b')
    await git(repo, ['add', 'b.txt'])
    await git(repo, ['commit', '-q', '-m', 'fix', '--no-verify'])
    await git(repo, ['checkout', '-q', 'main'])
    const merge = await gitDelMerge(repo, ['merge', '--no-ff', 'fix', '-m', 'merge'])
    expect(merge.fallo).toBe(false)
    expect(existsSync(huella)).toBe(false)
  })

  it('la huella SI aparece cuando git corre con sus hooks: el test tiene dientes', () => {
    const { repo, huella } = repoConHook('post-checkout')
    execFileSync('git', ['checkout', '-q', '-b', 'x'], { cwd: repo })
    expect(existsSync(huella)).toBe(true)
  })
})
