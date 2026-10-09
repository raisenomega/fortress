import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { createGraphOmega } from './graph-omega'

const VERDICT =
  'VERDICT:{"resuelve_el_hallazgo":"SI","respeta_scope":"SI","respeta_doNotTouch":"SI",' +
  '"calidad_del_diff":"BUENO","riesgo_residual":"NINGUNO","veredicto_global":"APROBADO",' +
  '"razon":"correcto"}:END-VERDICT'

function fakeBin(script: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-omega-'))
  const file = join(dir, 'fake-claude')
  writeFileSync(file, `#!/bin/sh\n${script}\n`)
  chmodSync(file, 0o755)
  return file
}

describe('createGraphOmega (binario fake)', () => {
  it('VERDICT valido con usage: ok con verdict y factura', async () => {
    const bin = fakeBin(
      `echo '{"result":"${VERDICT.replace(/"/g, '\\"')}","usage":{"input_tokens":90,"output_tokens":10}}'` // prettier-ignore
    )
    const result = await createGraphOmega(bin, 'p1', true).run(tmpdir(), 'prompt')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.verdict.veredicto_global).toBe('APROBADO')
    expect(result.runMeta.tokensUsed).toBe(100)
  })

  it('respuesta sin bloque VERDICT: la constante clasifica y la autopsia viaja', async () => {
    const result = await createGraphOmega(fakeBin('echo "se ve bien"'), 'p1', true).run(tmpdir(), 'p')
    // Extremo a extremo por el sobre real del CLI: el diagnostico del parser y
    // el crudo sobreviven al camino, no solo dentro de toOmegaOutcome.
    expect(result).toMatchObject({ ok: false, error: 'omega_response_invalid' })
    if (result.ok) return
    expect(result.detail).toBe('sin bloque VERDICT en la respuesta')
    expect(result.raw).toContain('se ve bien')
  })

  it('timeout: lo mata y reporta timedOut', async () => {
    const result = await createGraphOmega(fakeBin('sleep 30'), 'p1', true, 150).run(tmpdir(), 'p')
    expect(result).toMatchObject({ ok: false, timedOut: true })
  })

  it('spawn roto: error con mensaje, sin lanzar', async () => {
    const result = await createGraphOmega('/no/existe', 'p1', true).run(tmpdir(), 'p')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.timedOut).toBe(false)
  })
})

describe('createGraphOmega — lo que el revisor ya no hereda', () => {
  afterEach(() => delete process.env.SSH_AUTH_SOCK)

  it('las llaves de la sesion viva del operador no bajan al hijo', async () => {
    process.env.SSH_AUTH_SOCK = '/run/user/1000/keyring/ssh'
    // El binario fake declara lo que VE: es la unica forma de medir el entorno
    // real del hijo y no la opcion que le pasamos.
    const bin = fakeBin('echo "sock:[$SSH_AUTH_SOCK]"')
    const result = await createGraphOmega(bin, 'p1', true).run(tmpdir(), 'p')
    if (result.ok) return expect.fail('la salida fake no es un VERDICT')
    expect(result.raw).toContain('sock:[]')
  })
})
