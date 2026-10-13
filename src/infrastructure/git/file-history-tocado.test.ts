import { execFileSync } from 'child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createGitFileHistory } from './file-history'

const history = createGitFileHistory()
let repo = ''
let base = ''

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: repo }).toString().trim()
}

function commit(file: string, body: string): void {
  writeFileSync(join(repo, file), body)
  git('add', file)
  git('-c', 'user.name=T', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', 'commit', '-m', file) // prettier-ignore
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'fcc-toco-'))
  git('init', '-q')
  commit('a.ts', 'uno')
  base = git('rev-parse', 'HEAD') // el sha del inicio del turno
})

afterEach(() => {
  rmSync(repo, { recursive: true, force: true })
})

describe('tocadoPorElArreglo (¿el arreglo del turno toco el fichero?)', () => {
  it('SI: el arreglo commiteo el fichero despues del sha base', async () => {
    commit('fix.ts', 'arreglo')
    expect(await history.tocadoPorElArreglo(repo, 'fix.ts', base)).toBe(true)
  })

  it('SI: el arreglo lo dejo en el indice sin commitear (como conservar() tras reset --soft)', async () => {
    writeFileSync(join(repo, 'fix.ts'), 'arreglo')
    git('add', 'fix.ts') // staged, sin commit: lo que ve el verify
    expect(await history.tocadoPorElArreglo(repo, 'fix.ts', base)).toBe(true)
  })

  it('NO: un fichero que el arreglo no toco (anti-mutante del no-vacio)', async () => {
    commit('fix.ts', 'arreglo')
    expect(await history.tocadoPorElArreglo(repo, 'ajeno.ts', base)).toBe(false)
    expect(await history.tocadoPorElArreglo(repo, 'a.ts', base)).toBe(false) // existe pero no cambio
  })

  it('ANTE LA DUDA, false: no es repo git / sha ilegible / fichero o sha vacio', async () => {
    const suelto = mkdtempSync(join(tmpdir(), 'fcc-nogit-'))
    expect(await history.tocadoPorElArreglo(suelto, 'fix.ts', base)).toBe(false)
    rmSync(suelto, { recursive: true, force: true })
    expect(await history.tocadoPorElArreglo(repo, 'fix.ts', 'no-es-un-sha')).toBe(false)
    expect(await history.tocadoPorElArreglo(repo, '', base)).toBe(false)
    expect(await history.tocadoPorElArreglo(repo, 'fix.ts', '')).toBe(false)
  })
})
