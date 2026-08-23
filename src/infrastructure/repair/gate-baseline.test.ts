import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { git } from './merge-repo-fixture'
import { medirHerencia, ruidoPropio } from './gate-baseline'

/** Linter de mentira: una linea por cada ERROR del fichero, y siempre rojo. */
function linter(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-linter-'))
  const bin = join(dir, 'npm')
  writeFileSync(
    bin,
    '#!/bin/sh\nfor f in *.ts; do sed -n "s/^ERROR/$f: error/p" "$f"; done\nexit 1\n'
  )
  chmodSync(bin, 0o755)
  return bin
}

/** Repo con una base y un fix encima; `errores` los pone en el fichero tocado. */
function repo(erroresBase: number, erroresFix: number, tocaDeps = false): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-base-'))
  const lineas = (n: number): string => 'ERROR\n'.repeat(n) + 'fin\n'
  git(dir, 'init', '-b', 'main')
  git(dir, 'config', 'user.email', 'test@fortress')
  git(dir, 'config', 'user.name', 'test')
  git(dir, 'config', 'commit.gpgsign', 'false')
  writeFileSync(join(dir, 'a.ts'), lineas(erroresBase))
  git(dir, 'add', '.')
  git(dir, 'commit', '-m', 'base')

  git(dir, 'checkout', '-b', 'fix')
  writeFileSync(join(dir, 'a.ts'), `${lineas(erroresFix)}tocado por el fix\n`)
  if (tocaDeps) writeFileSync(join(dir, 'package.json'), '{"name":"x"}')
  git(dir, 'add', '.')
  git(dir, 'commit', '-m', 'fix')
  return dir
}

const base = (dir: string): string => git(dir, 'rev-parse', 'main').trim()
const CMD = { key: 'lint', args: ['run', 'lint'], timeoutMs: 5000 }

const medir = (dir: string, salidaFix: string): ReturnType<typeof medirHerencia> =>
  medirHerencia('p1', linter(), dir, base(dir), CMD, salidaFix)

describe('medirHerencia: de quien es el rojo', () => {
  it('el ruido propio son las quejas que nombran un fichero del fix', () => {
    expect(ruidoPropio('a.ts: error\nb.ts: error\na.ts: error\n', ['a.ts'])).toBe(2)
    expect(ruidoPropio('a.ts: error', [])).toBe(0)
  })

  it('ya estaba rojo y el fix no anade nada suyo: heredado', async () => {
    const dir = repo(2, 2)
    expect(await medir(dir, 'a.ts: error\na.ts: error\n')).toEqual({ heredado: true })
  })

  it('ya estaba rojo pero el fix anade quejas propias: NO heredado', async () => {
    const dir = repo(1, 3)
    expect(await medir(dir, 'a.ts: error\na.ts: error\na.ts: error\n')).toEqual({ heredado: false })
  })

  it('el fix toca las dependencias: no se mide, y se dice por que', async () => {
    const medida = await medir(repo(2, 2, true), 'a.ts: error\n')
    expect(medida).toMatchObject({ heredado: false })
    expect(medida.sinMedir).toContain('dependencias')
  })

  it('la rama del fix se recupera tras visitar la base', async () => {
    const dir = repo(2, 2)
    await medir(dir, 'a.ts: error\n')
    expect(git(dir, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('fix')
  })
})
