import { describe, expect, it, vi } from 'vitest'
import type { PostureScanner } from '@domain/posture/posture-scanner'
import { runPosture } from './run-posture'

const scanner = (): PostureScanner => ({
  scan: vi.fn(async () => ({ host: 'x', score: 100, findings: [], durationMs: 1, at: 'now' }))
})

const base = { url: 'midominio.com', depth: 'baja' as const, owned: true }

describe('runPosture', () => {
  it('sin confirmar propiedad NO toca la red', async () => {
    // La confirmacion va antes que nada: es lo que separa auditar lo tuyo de
    // escanear a un tercero.
    const s = scanner()
    const salida = await runPosture(s, { ...base, owned: false })
    expect(salida.ok).toBe(false)
    expect(s.scan).not.toHaveBeenCalled()
  })

  it('rechaza una direccion invalida antes de escanear', async () => {
    const s = scanner()
    expect((await runPosture(s, { ...base, url: 'file:///etc' })).ok).toBe(false)
    expect(s.scan).not.toHaveBeenCalled()
  })

  it('con permiso y direccion valida, escanea', async () => {
    const s = scanner()
    expect((await runPosture(s, base)).ok).toBe(true)
    expect(s.scan).toHaveBeenCalledOnce()
  })
})
