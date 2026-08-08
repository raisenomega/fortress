import { execFileSync } from 'child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createGitFileHistory } from './file-history'

const history = createGitFileHistory()
let repo = ''

/** Fechas ancla: una anterior a todo commit y otra posterior. */
const ANTES = '2020-01-01T00:00:00Z'
const DESPUES = '2100-01-01T00:00:00Z'

function git(...args: string[]): void {
  execFileSync('git', args, { cwd: repo, stdio: 'ignore' })
}

function commit(file: string, body: string): void {
  writeFileSync(join(repo, file), body)
  git('add', file)
  git('-c', 'user.name=T', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', 'commit', '-m', file) // prettier-ignore
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'fcc-git-'))
  git('init', '-q')
  commit('a.ts', 'uno')
})

afterEach(() => {
  rmSync(repo, { recursive: true, force: true })
})

describe('createGitFileHistory (la segunda prueba de la extincion)', () => {
  it('dice que SI cambio si hay un commit del archivo despues de la fecha', async () => {
    expect(await history.changedSince(repo, 'a.ts', ANTES)).toBe(true)
  })

  it('dice que NO cambio si el unico commit es anterior a la fecha', async () => {
    expect(await history.changedSince(repo, 'a.ts', DESPUES)).toBe(false)
  })

  it('distingue archivos: tocar uno no da por tocado al otro', async () => {
    commit('b.ts', 'dos')
    expect(await history.changedSince(repo, 'b.ts', ANTES)).toBe(true)
    expect(await history.changedSince(repo, 'c.ts', ANTES)).toBe(false) // nunca existio
  })

  it('borrar el archivo cuenta como cambio: el hallazgo puede extinguirse', async () => {
    git('rm', '-q', 'a.ts')
    git('-c', 'user.name=T', '-c', 'user.email=t@t', 'commit', '-m', 'borrado')
    expect(await history.changedSince(repo, 'a.ts', ANTES)).toBe(true)
  })

  it('ANTE LA DUDA, false: sin repo git no se puede afirmar que cambiara', async () => {
    const suelto = mkdtempSync(join(tmpdir(), 'fcc-nogit-'))
    expect(await history.changedSince(suelto, 'a.ts', ANTES)).toBe(false)
    rmSync(suelto, { recursive: true, force: true })
  })

  it('un hallazgo global (sin archivo) o sin fecha no se puede comprobar', async () => {
    expect(await history.changedSince(repo, '', ANTES)).toBe(false)
    expect(await history.changedSince(repo, 'a.ts', '')).toBe(false)
  })

  it('REGRESION: una fecha ilegible NO extingue (git ignoraba --since en silencio)', async () => {
    // Con `--since` git parseaba con approxidate y, al no entender la fecha,
    // devolvia el commit igual: el hallazgo se extinguia por un fallo de parseo.
    expect(await history.changedSince(repo, 'a.ts', 'no-es-una-fecha')).toBe(false)
    expect(await history.changedSince(repo, 'a.ts', '31/02/2026')).toBe(false)
  })
})
