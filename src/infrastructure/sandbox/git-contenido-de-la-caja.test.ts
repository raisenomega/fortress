import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { olvidarSonda } from './sonda-de-bwrap'
import { correHostil, repoConWorktree } from './repo-worktree-fixture'

afterEach(olvidarSonda)
afterAll(limpiarCarpetasDePrueba)

/** Tipo del objeto `sha` en el repo de FUERA: prueba que el commit de dentro
 *  de la caja llego al disco real (legs 2-3, objects+refs). */
const tipoEnHost = (repo: string, sha: string): string =>
  execFileSync('git', ['-c', 'core.hooksPath=/dev/null', 'cat-file', '-t', sha], { cwd: repo, encoding: 'utf8' }).trim() // prettier-ignore

describe('el .git comun: escribible para el motor, SIN ejecucion para el cliente', () => {
  it('el codigo auditado NO planta hook ni config, y el motor SIGUE vivo', () => {
    const { repo, comun, worktree } = repoConWorktree()
    const r = correHostil(worktree, comun)
    expect(r['plant_hook']).toMatch(/^NO:/) // hooks/ en solo lectura
    expect(r['plant_cfg']).toMatch(/^NO:/) // config en solo lectura
    expect(r['commit']).toMatch(/^OK:[0-9a-f]{40}$/) // leg 2-3: commit vivo
    expect(r['worktree']).toBe('OK:REGISTRADO') // leg 1: worktree vivo
    expect(existsSync(join(comun, 'hooks', 'pre-commit'))).toBe(false)
    expect(existsSync(join(comun, 'HUELLA'))).toBe(false)
    expect(readFileSync(join(comun, 'config'), 'utf8')).not.toMatch(/fsmonitor/)
    expect(tipoEnHost(repo, (r['commit'] ?? '').slice(3))).toBe('commit')
  })

  it('con los overlays FUERA el plantado SI entra: la guarda tiene dientes', () => {
    const { comun, worktree } = repoConWorktree()
    const r = correHostil(worktree, comun, false)
    expect(r['plant_hook']).toBe('OK:PLANTADO')
    expect(existsSync(join(comun, 'hooks', 'pre-commit'))).toBe(true)
  })
})
