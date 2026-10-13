import { afterAll, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { repoConFsmonitor } from './repo-con-fsmonitor-fixture'

afterAll(limpiarCarpetasDePrueba)

const ORQ = join(dirname(fileURLToPath(import.meta.url)), '../../../templates/fortress-orchestrator.sh') // prettier-ignore

/** Corre `status` del orquestador contra UNA victima, con HOME propio y un
 *  `claude` de pega (solo para pasar check_dependencies). stdout pase lo que pase. */
function correStatus(victima: string): string {
  const home = carpetaDePrueba('.fortress-orq-home-')
  const bin = join(home, 'bin')
  mkdirSync(bin, { recursive: true })
  writeFileSync(join(bin, 'claude'), '#!/bin/sh\nexit 0\n', { mode: 0o755 })
  mkdirSync(join(home, '.fortress'), { recursive: true })
  writeFileSync(join(home, '.fortress', 'repos.conf'), `victima|${victima}|origin|main|\n`)
  const env = { ...process.env, HOME: home, PATH: `${bin}:${process.env.PATH ?? ''}` }
  try {
    return execFileSync('bash', [ORQ, 'status'], { env, encoding: 'utf8' })
  } catch (e) {
    return String((e as { stdout?: string }).stdout ?? '')
  }
}

describe('orchestrator.sh: los git de LECTURA tampoco ejecutan hooks del cliente', () => {
  it('core.fsmonitor malicioso: `status` corre git status y NO lo dispara', () => {
    const { repo, huella } = repoConFsmonitor()
    const out = correStatus(repo)
    expect(out).toContain('victima') // el orquestador SI llego a su git status
    expect(existsSync(huella)).toBe(false) // y ese git status NO ejecuto el fsmonitor
  })

  it('la huella SI aparece con git status a pelo: el test tiene dientes', () => {
    const { repo, huella } = repoConFsmonitor()
    execFileSync('git', ['status', '--porcelain'], { cwd: repo })
    expect(existsSync(huella)).toBe(true)
  })
})
