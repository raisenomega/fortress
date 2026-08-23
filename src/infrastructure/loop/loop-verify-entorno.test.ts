import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { loopVerify } from './loop-verify'

/**
 * Un proyecto de mentira cuyo `npm` es un chivato: apunta lo que ve en el
 * entorno. Es la unica forma honesta de probar esto — comprobar que el codigo
 * "llama al helper" seria probar la implementacion, no la garantia.
 */
function proyecto(script: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-loop-verify-'))
  const npm = join(dir, 'npm')
  writeFileSync(npm, `#!/bin/sh\n${script}\n`)
  chmodSync(npm, 0o755)
  process.env.PATH = `${dir}:${process.env.PATH ?? ''}`
  return dir
}

const PATH_ORIGINAL = process.env.PATH
afterEach(() => {
  process.env.PATH = PATH_ORIGINAL
  delete process.env.SSH_AUTH_SOCK
})

describe('el verify corre el script del repo AJENO con el entorno acotado', () => {
  it('las llaves de la sesion del operador no llegan al script', async () => {
    // `npm run typecheck` ejecuta el package.json del proyecto que se esta
    // arreglando. Heredar el entorno le entregaba el agente ssh vivo.
    process.env.SSH_AUTH_SOCK = '/run/user/1000/keyring/ssh'
    const dir = proyecto('test -n "$SSH_AUTH_SOCK" && exit 3\nexit 0')

    expect(await loopVerify(dir)).toBe(true)
  }, 20_000)

  it('CI viaja: sin ella un vitest a secas se queda en modo watch', async () => {
    const dir = proyecto('test "$CI" = "true" && exit 0\nexit 3')
    expect(await loopVerify(dir)).toBe(true)
  }, 20_000)
})

describe('no-regresion: el veredicto no cambia', () => {
  it('typecheck verde da por bueno el arbol', async () => {
    expect(await loopVerify(proyecto('exit 0'))).toBe(true)
  }, 20_000)

  it('typecheck rojo lo tumba', async () => {
    expect(await loopVerify(proyecto('echo "error TS2304" >&2\nexit 1'))).toBe(false)
  }, 20_000)

  it('un proyecto sin ese script se da por bueno, no se bloquea el loop', async () => {
    expect(await loopVerify(proyecto('echo "Missing script: typecheck" >&2\nexit 1'))).toBe(true)
  }, 20_000)
})
