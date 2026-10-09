import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, describe, expect, it } from 'vitest'
import { fallaDelProveedor } from '@domain/repair/falla-del-proveedor'
import { veredictoDelAnalisis } from '@domain/repair/veredicto-del-analisis'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { createGraphAnalyst } from './graph-analyst'

afterAll(limpiarCarpetasDePrueba)

/** Un `claude` que contesta EXACTAMENTE como la cuota agotada medida el
 *  2026-10-05: JSON con `is_error`, `api_error_status: 429`, el aviso en
 *  `result`, y codigo de salida 1. */
const claudeSinCuota = (): string => {
  const bin = join(mkdtempSync(join(tmpdir(), 'fcc-429-')), 'claude')
  const json = JSON.stringify({ type: 'result', subtype: 'success', is_error: true, api_error_status: 429, result: "You've reached your Fable limit. Switch to another model", num_turns: 1 }) // prettier-ignore
  // Heredoc: el aviso real lleva apostrofo («You've») y un echo '…' lo partiria.
  writeFileSync(bin, `#!/bin/sh\ncat >/dev/null\ncat <<'JSON'\n${json}\nJSON\nexit 1\n`)
  chmodSync(bin, 0o755)
  return bin
}

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'x' }

describe('el analista VE el 429: no lo confunde con su analisis', () => {
  it('cuota agotada → analisis marcado del proveedor, veredicto provider_error (averia)', async () => {
    const analista = createGraphAnalyst(claudeSinCuota(), carpetaDePrueba('.fortress-429-'), 'p-429', true)
    const { analysis } = await analista.study(TARGET, [])
    expect(fallaDelProveedor(analysis)).toBe(true)
    expect(veredictoDelAnalisis(analysis).reason).toMatch(/^provider_error: 429: You've reached/)
  })
})
