import { describe, expect, it } from 'vitest'
import type { NewAgentRun } from '@domain/telemetry/agent-run'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { AppContext } from '../context'
import { recordMotorRun } from './record-motor-run'

const USAGE = { ...EMPTY_USAGE, inputTokens: 1000, cacheCreationTokens: 8000, costUsd: 7.5 }
const META = { durationMs: 153_000, startedAt: 1, endedAt: 2, tokensUsed: 9000, usage: USAGE }

function banco(): { ctx: AppContext; filas: NewAgentRun[] } {
  const filas: NewAgentRun[] = []
  const ctx = { runs: { record: (r: NewAgentRun) => void filas.push(r) } } as unknown as AppContext
  return { ctx, filas }
}

describe('recordMotorRun: el motor entra en el libro mayor del tope', () => {
  it('asienta la corrida con kind repair y la factura entera', () => {
    const { ctx, filas } = banco()
    recordMotorRun(ctx, 'proj', null, META)

    expect(filas).toHaveLength(1)
    expect(filas[0]).toMatchObject({ projectId: 'proj', kind: 'repair', failed: false })
    expect(filas[0].usage.costUsd).toBe(7.5)
    expect(filas[0].usage.cacheCreationTokens).toBe(8000)
  })

  it('el analista y el generador van sin agente; el revisor con el suyo', () => {
    // La lista de agentes gobierna el catalogo que el operador elige, y estas
    // dos son fases del motor. El revisor ya firma con ese nombre en su libro.
    const { ctx, filas } = banco()
    recordMotorRun(ctx, 'proj', null, META)
    recordMotorRun(ctx, 'proj', 'sentinel-omega', META)

    expect(filas.map((f) => f.agentId)).toEqual([null, 'sentinel-omega'])
  })

  it('sin factura legible no se asienta nada', () => {
    // Escribirla en cero diria que salio gratis.
    const { ctx, filas } = banco()
    recordMotorRun(ctx, 'proj', null, { durationMs: 10, startedAt: 1, endedAt: 2 })

    expect(filas).toHaveLength(0)
  })

  it('una corrida fallida se asienta igual: gasto tuvo', () => {
    const { ctx, filas } = banco()
    recordMotorRun(ctx, 'proj', 'sentinel-omega', META, true)

    expect(filas[0]).toMatchObject({ failed: true, kind: 'repair' })
  })

  it('si el libro revienta, la fase sigue', () => {
    const ctx = { runs: { record: () => { throw new Error('base caida') } } } as unknown as AppContext // prettier-ignore
    expect(() => recordMotorRun(ctx, 'proj', null, META)).not.toThrow()
  })
})
