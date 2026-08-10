import { execFileSync } from 'child_process'
import { existsSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { createWorktreeManager } from './worktree-manager'

/** Repo git REAL en tmp: el manager se prueba contra git, no contra un doble. */
function seedRepo(): { repo: string; baseSha: string } {
  const repo = mkdtempSync(join(tmpdir(), 'fcc-wt-repo-'))
  const git = (...args: string[]): string =>
    execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
  git('init', '-b', 'main')
  git('config', 'user.email', 'test@fortress')
  git('config', 'user.name', 'test')
  writeFileSync(join(repo, 'a.ts'), 'export const a = 1\n')
  git('add', '-A')
  git('commit', '-m', 'base')
  return { repo, baseSha: git('rev-parse', 'HEAD').trim() }
}

describe('createWorktreeManager (git real)', () => {
  it('ciclo completo: create -> cambio -> commit -> diff -> remove', async () => {
    const { repo, baseSha } = seedRepo()
    const manager = createWorktreeManager()
    const wt = join(tmpdir(), `fcc-wt-${Date.now()}`)

    const created = await manager.create(baseSha, repo, wt, 'repair/test-ciclo')
    expect(created).toEqual({ ok: true })
    expect(await manager.isClean(wt)).toBe(true)
    expect(await manager.hasChanges(wt)).toBe(false)

    writeFileSync(join(wt, 'a.test.ts'), 'export const t = 1\n')
    expect(await manager.hasChanges(wt)).toBe(true)
    expect(await manager.changedFiles(wt)).toEqual(['a.test.ts'])

    const commit = await manager.commit(wt, 'repair(test): fix')
    expect(commit.ok).toBe(true)
    if (commit.ok) expect(commit.sha).toMatch(/^[0-9a-f]{40}$/)

    const diff = await manager.diff(wt, baseSha)
    expect(diff.files).toEqual(['a.test.ts'])
    expect(diff.insertions).toBeGreaterThanOrEqual(1)

    await manager.remove(wt, 'repair/test-ciclo', repo)
    expect(existsSync(wt)).toBe(false)
  })

  it('create con un SHA inexistente falla con error legible', async () => {
    const { repo } = seedRepo()
    const manager = createWorktreeManager()
    const result = await manager.create('0'.repeat(40), repo, join(tmpdir(), `fcc-wt-bad-${Date.now()}`), 'repair/bad') // prettier-ignore
    expect(result.ok).toBe(false)
  })

  it('commit sin cambios reporta el fallo, no revienta', async () => {
    const { repo, baseSha } = seedRepo()
    const manager = createWorktreeManager()
    const wt = join(tmpdir(), `fcc-wt-empty-${Date.now()}`)
    await manager.create(baseSha, repo, wt, 'repair/empty')

    const commit = await manager.commit(wt, 'nada')
    expect(commit.ok).toBe(false)
    await manager.remove(wt, 'repair/empty', repo)
  })
})
