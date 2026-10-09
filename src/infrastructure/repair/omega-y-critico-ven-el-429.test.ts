import { describe, expect, it } from 'vitest'
import { falloDeOmega } from '@application/repair/omega-autopsia'
import { esAveria } from '@domain/repair/averia'
import { toOmegaOutcome } from './omega-outcome'
import { processOmegaOut } from './omega-out'

/** La salida MEDIDA del CLI con la cuota agotada (2026-10-05). */
const CUOTA = JSON.stringify({ type: 'result', subtype: 'success', is_error: true, api_error_status: 429, result: "You've reached your Fable limit. Switch to another model" }) // prettier-ignore
const meta = (): { durationMs: number; startedAt: number; endedAt: number } => ({ durationMs: 1, startedAt: 0, endedAt: 1 }) // prettier-ignore

/**
 * Esa misma noche OMEGA murio en el MISMO segundo como «omega_response_invalid:
 * sin bloque VERDICT» — el aviso leido como una respuesta mal formada, que no es
 * averia y no paro nada. Y el critico lo habria tomado por una OBJECION.
 */
describe('OMEGA y el critico ven el 429', () => {
  it('la salida abierta trae el fallo del proveedor aparte del texto', () => {
    expect(processOmegaOut(CUOTA).proveedor).toMatch(/^429: You've reached/)
  })

  it('OMEGA: provider_error, no omega_response_invalid — y la autopsia lo clasifica AVERIA', () => {
    const r = toOmegaOutcome(CUOTA, meta)
    expect(r).toMatchObject({ ok: false, error: 'provider_error' })
    if (r.ok) return
    const { reason } = falloDeOmega(r)
    expect(reason).toBe('provider_error')
    expect(esAveria(reason)).toBe(true)
  })
})

describe('el critico tampoco toma el aviso de cuota por una objecion', () => {
  it('claude sin cuota → el critico falla con provider_error, sin texto de objecion', async () => {
    const { chmodSync, mkdtempSync, writeFileSync } = await import('fs')
    const { tmpdir } = await import('os')
    const { join } = await import('path')
    const { createGraphCritico } = await import('./graph-critico')
    const bin = join(mkdtempSync(join(tmpdir(), 'fcc-critico-429-')), 'claude')
    writeFileSync(bin, `#!/bin/sh\ncat >/dev/null\ncat <<'JSON'\n${CUOTA}\nJSON\nexit 1\n`)
    chmodSync(bin, 0o755)
    const r = await createGraphCritico(bin, 'p-429', true).run(mkdtempSync(join(tmpdir(), 'fcc-arbol-')), 'ataca el fix')
    expect(r).toMatchObject({ ok: false, error: 'provider_error' })
  })
})
