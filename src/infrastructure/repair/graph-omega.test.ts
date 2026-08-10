import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
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
    const result = await createGraphOmega(bin).run(tmpdir(), 'prompt')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.verdict.veredicto_global).toBe('APROBADO')
    expect(result.runMeta.tokensUsed).toBe(100)
  })

  it('respuesta sin bloque VERDICT: omega_response_invalid', async () => {
    const result = await createGraphOmega(fakeBin('echo "se ve bien"')).run(tmpdir(), 'p')
    expect(result).toMatchObject({ ok: false, error: 'omega_response_invalid' })
  })

  it('timeout: lo mata y reporta timedOut', async () => {
    const result = await createGraphOmega(fakeBin('sleep 30'), 150).run(tmpdir(), 'p')
    expect(result).toMatchObject({ ok: false, timedOut: true })
  })

  it('spawn roto: error con mensaje, sin lanzar', async () => {
    const result = await createGraphOmega('/no/existe').run(tmpdir(), 'p')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.timedOut).toBe(false)
  })
})
