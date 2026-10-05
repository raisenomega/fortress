import { describe, expect, it, vi } from 'vitest'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'

/**
 * Principio 24 aplicado a la rafaga del 2026-10-05: las corridas del analista
 * que murieron por la cuota quedaron en `agent_runs` como «ok $0 1t». Un fallo
 * apuntado como exito es un estado que no puede expresar el fallo.
 */
describe('la corrida del analista que el proveedor tumbo se asienta FALLIDA', () => {
  it('analisis del proveedor → fila failed: true, y la propuesta sale con provider_error', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], verdictStatus: 'PROVEEDOR' })
    const espia = vi.spyOn(b.context.runs, 'record')
    await planRepair(b.context, 'p1')
    expect(espia).toHaveBeenCalledWith(expect.objectContaining({ failed: true, kind: 'repair' }))
    expect(b.patches.at(-1)?.analysisReason).toMatch(/^provider_error: 429/)
  })

  it('un analisis normal sigue asentandose como exito', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], verdictStatus: 'REAL' })
    const espia = vi.spyOn(b.context.runs, 'record')
    await planRepair(b.context, 'p1')
    expect(espia).toHaveBeenCalledWith(expect.objectContaining({ failed: false }))
  })
})
