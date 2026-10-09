import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { createGraphGenerator } from './graph-generator'

/** Binario fake: el generador solo mira exit code y el JSON de stdout. */
function fakeBin(script: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-gen-'))
  const file = join(dir, 'fake-claude')
  writeFileSync(file, `#!/bin/sh\n${script}\n`)
  chmodSync(file, 0o755)
  return file
}

describe('createGraphGenerator', () => {
  it('exit 0 con usage devuelve ok y la factura', async () => {
    const bin = fakeBin(`echo '{"result":"listo","usage":{"input_tokens":100,"output_tokens":50}}'`)
    const result = await createGraphGenerator(bin, 'p1', true).generate(tmpdir(), 'prompt')
    expect(result.ok).toBe(true)
    expect(result.runMeta.tokensUsed).toBe(150)
    expect(result.runMeta.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('exit != 0 devuelve error con codigo, y la duracion igual', async () => {
    const result = await createGraphGenerator(fakeBin('exit 7'), 'p1', true).generate(tmpdir(), 'p')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/codigo 7/)
    expect(result.runMeta.tokensUsed).toBeUndefined()
  })

  it('el timeout mata el proceso y reporta', async () => {
    const result = await createGraphGenerator(fakeBin('sleep 30'), 'p1', true, 150).generate(
      tmpdir(),
      'p'
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/timeout/)
  })

  it('sin JSON en stdout no se inventa factura: undefined', async () => {
    const result = await createGraphGenerator(fakeBin('echo hola'), 'p1', true).generate(tmpdir(), 'p')
    expect(result.ok).toBe(true)
    expect(result.runMeta.tokensUsed).toBeUndefined()
  })
})

/**
 * El binario fake hace de chivato: mira su propio entorno y sale por 3 si ve lo
 * que no deberia. Se prueba la GARANTIA, no la llamada — comprobar que el codigo
 * "invoca al helper" seria probar la implementacion.
 */
describe('el agente que EDITA arranca con el entorno recortado', () => {
  afterEach(() => {
    delete process.env.SSH_AUTH_SOCK
  })

  it('las llaves de la sesion viva del operador no llegan al CLI ni a sus MCP', async () => {
    process.env.SSH_AUTH_SOCK = '/run/user/1000/keyring/ssh'
    const bin = fakeBin(`test -n "$SSH_AUTH_SOCK" && exit 3\necho '{"result":"listo"}'`)

    expect((await createGraphGenerator(bin, 'p1', true).generate(tmpdir(), 'p')).ok).toBe(true)
  })

  it('HOME sigue viajando: de ahi salen las credenciales con las que se factura', async () => {
    const bin = fakeBin(`test -z "$HOME" && exit 3\necho '{"result":"listo"}'`)

    expect((await createGraphGenerator(bin, 'p1', true).generate(tmpdir(), 'p')).ok).toBe(true)
  })
})
