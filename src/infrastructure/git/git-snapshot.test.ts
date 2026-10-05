import { execFileSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { gitSnapshot } from './git-snapshot'

/**
 * El `add -A` del checkpoint corre en el arbol AUDITADO, y un filtro `clean`
 * de su config local es codigo del cliente. Ese codigo no debe ver la sesion
 * del operador (ADR-095 §4.1); y el checkpoint, con el entorno acotado, sigue
 * dando su sha y no el null del catch.
 */
describe('gitSnapshot con el entorno acotado', () => {
  let dir: string
  let fuera: string
  const previo = process.env.SSH_AUTH_SOCK

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'snap-env-'))
    fuera = mkdtempSync(join(tmpdir(), 'snap-out-'))
    const g = (...a: string[]): string => execFileSync('git', a, { cwd: dir, encoding: 'utf8' })
    g('init', '-q')
    g('config', 'user.name', 'Prueba')
    g('config', 'user.email', 'prueba@example.com')
    g('config', 'commit.gpgsign', 'false')
    g('config', 'filter.espia.clean', `sh -c 'printf "%s" "$SSH_AUTH_SOCK" > ${join(fuera, 'visto')}; cat'`)
    writeFileSync(join(dir, '.gitattributes'), '*.txt filter=espia\n')
    writeFileSync(join(dir, 'a.txt'), 'hola\n')
    process.env.SSH_AUTH_SOCK = '/tmp/agente-del-operador'
  })

  afterEach(() => {
    if (previo === undefined) delete process.env.SSH_AUTH_SOCK
    else process.env.SSH_AUTH_SOCK = previo
    rmSync(dir, { recursive: true, force: true })
    rmSync(fuera, { recursive: true, force: true })
  })

  it('el filtro clean del repo no ve el agente ssh y el checkpoint da su sha', () => {
    expect(gitSnapshot(dir)).toMatch(/^[0-9a-f]{40}$/)
    expect(readFileSync(join(fuera, 'visto'), 'utf8')).toBe('')
  })
})
