import { describe, expect, it } from 'vitest'
import { esAveria } from '@domain/repair/averia'
import { isRejectionReason } from '@domain/repair/repair-rejection'
import { isRetryable } from '@domain/repair/retry-eligibility'
import { bench } from './generate-fix-fixture'
import { generateFix } from './generate-fix'

describe('agotar los turnos: desenlace propio', () => {
  it('no se disfraza de exceso de presupuesto ni de averia del generador', async () => {
    const b = bench({ turnosAgotados: true })
    const r = await generateFix(b.context, 'prop-1', b.deps)

    expect(r).toMatchObject({ ok: false, reason: 'turnos_agotados' })
    expect(r).not.toMatchObject({ reason: 'budget_exceeded' })
    expect(r).not.toMatchObject({ reason: 'generator_error' })
  })

  it('dice cuantas vueltas dio, no un codigo de salida', async () => {
    const b = bench({ turnosAgotados: true })
    expect(await generateFix(b.context, 'prop-1', b.deps)).toMatchObject({
      detail: expect.stringContaining('no completo en 30 turnos') as unknown as string
    })
  })

  it('conserva el worktree: hay medio fix que mirar', async () => {
    const b = bench({ turnosAgotados: true })
    await generateFix(b.context, 'prop-1', b.deps)
    expect(b.calls).not.toContain('remove')
  })

  it('asienta la factura: se pago aunque no terminara', async () => {
    const b = bench({ turnosAgotados: true })
    await generateFix(b.context, 'prop-1', b.deps)
    expect(b.events.some((e) => e.eventType === 'AGENT_RUN')).toBe(true)
  })

  it('es un motivo de rechazo del dominio, no una cadena suelta', () => {
    expect(isRejectionReason('turnos_agotados')).toBe(true)
  })

  it('NO se reintenta: repetir contra el mismo techo daria lo mismo', () => {
    // La doctrina D24: solo los rechazos de RAZONAMIENTO merecen reintento.
    // Un techo agotado es tecnico, como un timeout o el presupuesto.
    expect(isRetryable('RECHAZADO', 'turnos_agotados')).toBe(false)
  })

  it('NO es averia del proveedor: el loop no debe reintentarlo para siempre', () => {
    // Las averias son 429, cuota o red. El techo es nuestro y funciono.
    expect(esAveria('turnos_agotados')).toBe(false)
  })
})
