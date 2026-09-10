import { execFileSync } from 'child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { listarFuente } from './listar-fuente'

let repo: string

const escribir = (ruta: string, texto = 'x'): void => {
  const destino = join(repo, ruta)
  mkdirSync(join(destino, '..'), { recursive: true })
  writeFileSync(destino, texto)
}

const git = (...args: string[]): void => void execFileSync('git', args, { cwd: repo, stdio: 'ignore' }) // prettier-ignore

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'manifiesto-'))
  git('init', '-q')
  escribir('.gitignore', 'node_modules/\n')
  escribir('src/domain/scanner.ts')
  escribir('src/app/run.ts')
  escribir('README.md')
  escribir('node_modules/paquete/index.js')
  git('add', '-A')
  git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'base')
})

afterEach(() => {
  rmSync(repo, { recursive: true, force: true })
})

describe('listarFuente contra un repo de verdad', () => {
  it('devuelve solo la fuente, en rutas relativas', async () => {
    expect(await listarFuente(repo)).toEqual(['src/app/run.ts', 'src/domain/scanner.ts'])
  })

  it('deja fuera lo que no es codigo: el .md no entra', async () => {
    expect(await listarFuente(repo)).not.toContain('README.md')
  })

  it('hereda el .gitignore: node_modules no aparece sin filtrarlo a mano', async () => {
    const fuente = await listarFuente(repo)
    expect(fuente.some((f) => f.includes('node_modules'))).toBe(false)
  })

  it('un fichero de fuente SIN rastrear tampoco entra: se audita lo versionado', async () => {
    escribir('src/domain/borrador.ts')

    expect(await listarFuente(repo)).not.toContain('src/domain/borrador.ts')
  })
})
