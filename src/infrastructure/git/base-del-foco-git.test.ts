import { execFileSync } from 'child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mensajeDurable } from '@domain/build/commit-durable'
import { baseDelFocoGit, ficherosConMarcadorNacidoGit } from './base-del-foco-git'

const ID = 'b3b09a0f-2a73-4108-b103-d79f836e47be'
let repo = ''

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: repo }).toString().trim()
}

function commit(file: string, body: string, msg: string): string {
  writeFileSync(join(repo, file), body)
  git('add', file)
  git('-c', 'user.name=T', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', 'commit', '-m', msg)
  return git('rev-parse', 'HEAD')
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'fcc-foco-'))
  git('init', '-q')
  commit('base.ts', 'base', 'scope: base del repo')
})

afterEach(() => {
  rmSync(repo, { recursive: true, force: true })
})

describe('baseDelFocoGit (la ventana por foco, INC-A)', () => {
  it('devuelve el PADRE del commit fix(<id>) mas antiguo', async () => {
    const antesDelFix = git('rev-parse', 'HEAD')
    commit('drop.sql', 'drop policy', mensajeDurable(ID, 'cerrar facade')) // fix(<id>): ...
    commit('drop.sql', 'drop policy v2', mensajeDurable(ID, 'ajustar facade')) // otro fix(<id>) mas nuevo
    expect(await baseDelFocoGit(repo, ID)).toBe(antesDelFix)
  })

  it('cross-contrato: mensajeDurable empieza por el patron que busca la puerta', () => {
    expect(mensajeDurable(ID, 'lo que sea')).toContain(`fix(${ID})`)
  })

  it('sin commit del fix de este id → null (cae a la base del turno)', async () => {
    commit('otro.sql', 'x', mensajeDurable('otro-id-distinto', 't'))
    expect(await baseDelFocoGit(repo, ID)).toBeNull()
  })

  it('findingId vacio → null', async () => {
    expect(await baseDelFocoGit(repo, '   ')).toBeNull()
  })

  it('no es repo git → null (conserva)', async () => {
    const suelto = mkdtempSync(join(tmpdir(), 'fcc-nogit-'))
    expect(await baseDelFocoGit(suelto, ID)).toBeNull()
    rmSync(suelto, { recursive: true, force: true })
  })
})

describe('ficherosConMarcadorNacido (inferencia P2)', () => {
  it('el fichero cuyas ADICIONES traen el marcador (nacio con el fix)', async () => {
    commit('drop.sql', 'DROP POLICY anon', mensajeDurable(ID, 'cierra'))
    expect(await ficherosConMarcadorNacidoGit(repo, ID, 'DROP POLICY')).toEqual(['drop.sql'])
  })

  it('NO si el marcador solo esta en CONTEXTO del diff (preexistia), no en adiciones', async () => {
    // 'DROP POLICY' ya estaba: sale como contexto (' '), no como adicion ('+').
    commit('ff.sql', 'DROP POLICY anon\nold', mensajeDurable('previo', 'base'))
    commit('ff.sql', 'DROP POLICY anon\nnew', mensajeDurable(ID, 'cierra'))
    expect(await ficherosConMarcadorNacidoGit(repo, ID, 'DROP POLICY')).toEqual([])
    expect(await ficherosConMarcadorNacidoGit(repo, ID, '')).toEqual([]) // marcador vacio
    expect(await ficherosConMarcadorNacidoGit(repo, 'otro-id', 'DROP')).toEqual([]) // sin fix de ese id
  })
})
