import { describe, expect, it } from 'vitest'
import { bench } from './run-omega-fixture'
import { runOmega } from './run-omega'

const META = { tokensUsed: 120_000, durationMs: 1, startedAt: 1, endedAt: 2 }
const CRUDO = `${'el juez razono largo y tendido antes de no cerrar el bloque. '.repeat(60)}fin`

/** El fallo de lectura de OMEGA con su autopsia: 2a1b356c paso el gate en verde
 *  con 78 inserciones y se perdio con 34 caracteres genericos en el libro. */
const fallo = {
  ok: false as const,
  error: 'omega_response_invalid',
  detail: 'sin bloque VERDICT en la respuesta',
  raw: CRUDO,
  timedOut: false,
  runMeta: META
}

describe('runOmega — la autopsia llega al libro', () => {
  it('el asiento lleva el diagnostico preciso, no solo la constante', async () => {
    const b = bench({ result: fallo })
    const salida = await runOmega(b.context, 'prop-1', b.deps)
    expect(salida).toMatchObject({ ok: false, reason: 'omega_response_invalid' })
    expect(b.patches.at(-1)?.analysisReason).toBe(
      'omega_response_invalid: sin bloque VERDICT en la respuesta'
    )
  })

  it('el crudo ENTERO viaja en el evidence del AGENT_RUN, sin recortar', async () => {
    const b = bench({ result: fallo })
    await runOmega(b.context, 'prop-1', b.deps)
    const corrida = b.events.find((e) => e.eventType === 'AGENT_RUN')
    const evidencia = JSON.parse(corrida?.evidenceJson ?? '{}') as Record<string, unknown>
    expect(evidencia.raw).toBe(CRUDO)
    expect(evidencia.detail).toBe('sin bloque VERDICT en la respuesta')
    expect(String(evidencia.raw).length).toBeGreaterThan(3000)
  })

  it('la razon de rechazo se queda canonica: el diagnostico no la contamina', async () => {
    const b = bench({ result: fallo })
    await runOmega(b.context, 'prop-1', b.deps)
    expect(b.events.at(-1)).toMatchObject({
      toState: 'RECHAZADO',
      reason: 'omega_response_invalid'
    })
  })

  it('sin autopsia (timeout): el asiento no inventa detalle', async () => {
    // prettier-ignore
    const b = bench({ result: { ok: false, error: 'timeout', timedOut: true, runMeta: META } })
    await runOmega(b.context, 'prop-1', b.deps)
    expect(b.patches.at(-1)?.analysisReason).toBe('omega_timeout')
  })
})
