import { execFileSync } from 'child_process'
import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { lineasDeFicheros, readAtHead, readAtSha, showHead } from './worktree-file-reader'

/** Repo git REAL: base con a.ts; segundo commit lo cambia y crea nuevo.ts. */
function seedRepo(): { repo: string; baseSha: string } {
  const repo = mkdtempSync(join(tmpdir(), 'fcc-reader-'))
  const g = (...args: string[]): string => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }) // prettier-ignore
  g('init', '-b', 'main')
  g('config', 'user.email', 't@t')
  g('config', 'user.name', 't')
  writeFileSync(join(repo, 'a.ts'), 'version base\n')
  g('add', '-A')
  g('commit', '-m', 'base')
  const baseSha = g('rev-parse', 'HEAD').trim()
  writeFileSync(join(repo, 'a.ts'), 'version fix\n')
  writeFileSync(join(repo, 'nuevo.ts'), 'archivo nuevo\n')
  g('add', '-A')
  g('commit', '-m', 'fix')
  return { repo, baseSha }
}

describe('worktree-file-reader (git real)', () => {
  it('readAtHead lee el archivo actual; readAtSha lee el de base', async () => {
    const { repo, baseSha } = seedRepo()
    expect(readAtHead(repo, 'a.ts')).toBe('version fix\n')
    expect(await readAtSha(repo, baseSha, 'a.ts')).toBe('version base\n')
  })

  it('archivo NUEVO en el fix: en base devuelve vacio, sin fallar', async () => {
    const { repo, baseSha } = seedRepo()
    expect(readAtHead(repo, 'nuevo.ts')).toBe('archivo nuevo\n')
    expect(await readAtSha(repo, baseSha, 'nuevo.ts')).toBe('')
  })

  it('showHead trae el diff textual del commit del fix', async () => {
    const { repo } = seedRepo()
    const texto = await showHead(repo)
    expect(texto).toContain('commit')
    expect(texto).toContain('version fix')
    expect(texto).toContain('nuevo.ts')
  })

  it('archivo inexistente en head: vacio, sin lanzar', () => {
    const { repo } = seedRepo()
    expect(readAtHead(repo, 'no-existe.ts')).toBe('')
  })

  it('lineasDeFicheros mide el archivo YA con el fix puesto', () => {
    const { repo } = seedRepo()
    writeFileSync(join(repo, 'largo.ts'), 'x\n'.repeat(80))
    expect(lineasDeFicheros(repo, ['a.ts', 'largo.ts'])).toEqual({ 'a.ts': 1, 'largo.ts': 80 })
  })

  it('lo que no se deja leer se OMITE: cero diria que cabe algo que nadie miro', () => {
    const { repo } = seedRepo()
    expect(lineasDeFicheros(repo, ['no-existe.ts'])).toEqual({})
  })
})
