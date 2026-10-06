import { execFileSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { gitRevert, gitSnapshot } from './git-snapshot'

/**
 * El `add -A` del checkpoint corre en el arbol AUDITADO, y un filtro `clean`
 * de su config local es codigo del cliente. Ese codigo no debe ver la sesion
 * del operador (ADR-095 §4.1) ni nada que el recorte de `buildEnv` deja pasar:
 * un token de tercero o un `GIT_CONFIG_*` heredado. Y el checkpoint, con la
 * lista blanca, sigue dando su sha y revirtiendo, no el null del catch.
 */
const SEMBRADAS: Readonly<Record<string, string>> = {
  SSH_AUTH_SOCK: '/tmp/agente-del-operador',
  GITHUB_TOKEN: 'token-de-tercero',
  GIT_CONFIG_COUNT: '1',
  GIT_CONFIG_KEY_0: 'core.heredada',
  GIT_CONFIG_VALUE_0: 'si'
}

describe('gitSnapshot con el entorno acotado', () => {
  let dir: string
  let fuera: string
  const previo = Object.fromEntries(Object.keys(SEMBRADAS).map((k) => [k, process.env[k]]))

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'snap-env-'))
    fuera = mkdtempSync(join(tmpdir(), 'snap-out-'))
    const g = (...a: string[]): string => execFileSync('git', a, { cwd: dir, encoding: 'utf8' })
    g('init', '-q')
    g('config', 'user.name', 'Prueba')
    g('config', 'user.email', 'prueba@example.com')
    g('config', 'commit.gpgsign', 'false')
    const ajeno = '$GITHUB_TOKEN$GIT_CONFIG_KEY_0'
    g('config', 'filter.espia.clean', `sh -c 'printf "%s" "$SSH_AUTH_SOCK" > ${join(fuera, 'visto')}; printf "%s" "${ajeno}" > ${join(fuera, 'ajeno')}; cat'`) // prettier-ignore
    writeFileSync(join(dir, '.gitattributes'), '*.txt filter=espia\n')
    writeFileSync(join(dir, 'a.txt'), 'hola\n')
    Object.assign(process.env, SEMBRADAS)
  })

  afterEach(() => {
    for (const [k, v] of Object.entries(previo)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    rmSync(dir, { recursive: true, force: true })
    rmSync(fuera, { recursive: true, force: true })
  })

  it('el filtro clean del repo no ve el agente ssh y el checkpoint da su sha', () => {
    expect(gitSnapshot(dir)).toMatch(/^[0-9a-f]{40}$/)
    expect(readFileSync(join(fuera, 'visto'), 'utf8')).toBe('')
  })

  it('el filtro clean no ve un token de tercero ni un GIT_CONFIG_* heredado', () => {
    expect(gitSnapshot(dir)).toMatch(/^[0-9a-f]{40}$/)
    expect(readFileSync(join(fuera, 'ajeno'), 'utf8')).toBe('')
  })

  it('con la lista blanca el revert sigue devolviendo el arbol al checkpoint', () => {
    const sha = gitSnapshot(dir)
    expect(sha).toMatch(/^[0-9a-f]{40}$/)
    writeFileSync(join(dir, 'a.txt'), 'roto\n')
    gitRevert(dir, sha ?? '')
    expect(readFileSync(join(dir, 'a.txt'), 'utf8')).toBe('hola\n')
  })
})
