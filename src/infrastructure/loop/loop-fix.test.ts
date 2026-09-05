import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import * as motor from '@application/repair/run-motor-chain'
import { isRunning } from '../run-control'
import { loopFix } from './loop-fix'

const ctx = (over: Record<string, unknown> = {}): AppContext =>
  ({
    projects: { findById: () => ({ id: 'p1', contaminated: false }) },
    settings: { get: () => null },
    runs: { usageSince: () => ({ costUsd: 0 }), sinFacturaSince: () => ({ runs: 0 }) },
    ...over
  }) as unknown as AppContext

const correr = (c: AppContext, pid = 'p1'): ReturnType<typeof loopFix> =>
  loopFix(c, pid, {} as never, 'completo')

afterEach(() => vi.restoreAllMocks())

describe('el motor del bucle pasa por el mismo freno que su escaneo', () => {
  it('un proyecto CONTAMINADO no llega al motor', async () => {
    // Bloqueado "hasta revision humana" es lo ultimo a lo que soltarle el motor.
    const espia = vi.spyOn(motor, 'runMotorChain')
    const sucio = ctx({ projects: { findById: () => ({ id: 'p2', contaminated: true }) } })

    expect(await correr(sucio, 'p2')).toMatchObject({ ok: false })
    expect(espia).not.toHaveBeenCalled()
  })

  it('con el tope diario gastado tampoco: antes ni se consultaba', async () => {
    const espia = vi.spyOn(motor, 'runMotorChain')
    const sinSaldo = ctx({
      settings: { get: (k: string) => (k.includes('Day') ? '1' : null) },
      runs: { usageSince: () => ({ costUsd: 999 }), sinFacturaSince: () => ({ runs: 0 }) }
    })

    expect(await correr(sinSaldo)).toMatchObject({ ok: false })
    expect(espia).not.toHaveBeenCalled()
  })

  it('con saldo y limpio corre, y devuelve lo que el motor diga', async () => {
    const salida = { ok: true as const, value: { kind: 'sin-candidato' as const } }
    vi.spyOn(motor, 'runMotorChain').mockResolvedValue(salida)

    expect(await correr(ctx())).toBe(salida)
  })

  it('DEVUELVE el carril al terminar: si no, el proyecto queda ocupado siempre', async () => {
    vi.spyOn(motor, 'runMotorChain').mockResolvedValue({ ok: true, value: { kind: 'sin-candidato' } }) // prettier-ignore
    await correr(ctx())

    expect(isRunning('p1')).toBe(false)
  })

  it('y lo devuelve tambien si el motor LANZA', async () => {
    vi.spyOn(motor, 'runMotorChain').mockRejectedValue(new Error('reventon'))
    await expect(correr(ctx())).rejects.toThrow('reventon')

    expect(isRunning('p1')).toBe(false)
  })
})
