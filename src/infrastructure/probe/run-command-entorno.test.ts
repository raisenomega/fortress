import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { runCommand } from './run-command'

/** Un binario que solo cuenta lo que ve en su entorno. */
function chivato(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-probe-env-'))
  const bin = join(dir, 'chivato')
  writeFileSync(
    bin,
    '#!/bin/sh\necho "CI=[$CI] PATH=[$PATH] SSH=[$SSH_AUTH_SOCK] X=[$FCC_MARCA]"\n'
  )
  chmodSync(bin, 0o755)
  return bin
}

afterEach(() => {
  delete process.env.SSH_AUTH_SOCK
  delete process.env.FCC_MARCA
})

describe('el entorno con el que corre un probe', () => {
  it('las llaves de la sesion del operador NO llegan al codigo del repo', async () => {
    process.env.SSH_AUTH_SOCK = '/run/user/1000/keyring/ssh'
    process.env.FCC_MARCA = 'vale'

    const salida = (await runCommand(chivato(), [], tmpdir())).out

    expect(salida).toContain('SSH=[]')
    expect(salida).toContain('X=[]')
  })

  it('PATH y CI si viajan: sin ellos el probe no encuentra nada o se cuelga', async () => {
    const salida = (await runCommand(chivato(), [], tmpdir())).out
    expect(salida).toContain('CI=[true]')
    expect(salida).not.toContain('PATH=[]')
  })

  it('no-regresion: el probe sigue corriendo y devuelve su codigo', async () => {
    const resultado = await runCommand(chivato(), [], tmpdir())
    expect(resultado).toMatchObject({ code: 0, missing: false })
  })
})
