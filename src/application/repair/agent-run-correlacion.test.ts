import { describe, expect, it } from 'vitest'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import type { NewAgentRun } from '@domain/telemetry/agent-run'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { AppContext } from '../context'
import { conAgentRun, recordMotorRun } from './record-motor-run'

const META: AnalystRunMeta = {
  durationMs: 153_000,
  startedAt: 1,
  endedAt: 2,
  tokensUsed: 9000,
  usage: { ...EMPTY_USAGE, costUsd: 7.5 }
}

const ctxCon = (id: string): AppContext =>
  ({ runs: { record: (r: NewAgentRun) => ({ ...r, id, at: '' }) } }) as unknown as AppContext

describe('la corrida del motor se puede senalar desde el libro', () => {
  it('asentar devuelve el id de la fila', () => {
    expect(recordMotorRun(ctxCon('run-7'), 'proj', null, META)).toBe('run-7')
  })

  it('sin factura legible no hay fila y no hay id que citar', () => {
    const sinFactura = { durationMs: 10, startedAt: 1, endedAt: 2 }
    expect(recordMotorRun(ctxCon('run-7'), 'proj', null, sinFactura)).toBeNull()
  })

  it('si el libro revienta tampoco se inventa uno', () => {
    const roto = { runs: { record: () => { throw new Error('base caida') } } } as unknown as AppContext // prettier-ignore
    expect(recordMotorRun(roto, 'proj', null, META)).toBeNull()
  })

  it('el resultado viaja con el id dentro, listo para el asiento', () => {
    const resultado = { analysis: { status: 'REAL' }, runMeta: META }

    expect(conAgentRun(resultado, 'run-7').runMeta.agentRunId).toBe('run-7')
  })

  it('sin id el resultado queda intacto: mejor sin cita que con una falsa', () => {
    const resultado = { analysis: { status: 'REAL' }, runMeta: META }

    expect(conAgentRun(resultado, null)).toBe(resultado)
    expect(conAgentRun(resultado, null).runMeta.agentRunId).toBeUndefined()
  })
})
