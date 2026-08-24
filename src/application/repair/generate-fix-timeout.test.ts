import { describe, expect, it } from 'vitest'
import { bench } from './generate-fix-fixture'
import { generateFix } from './generate-fix'

describe('el reloj del generador tiene nombre propio y no finge factura', () => {
  it('RECHAZADO generator_timeout, no generator_error', async () => {
    const b = bench({ timedOut: true })
    const r = await generateFix(b.context, 'prop-1', b.deps)

    expect(r).toMatchObject({ ok: false, reason: 'generator_timeout' })
    expect(r).not.toMatchObject({ reason: 'provider_error' })
  })

  it('asienta la corrida SIN factura: ni cero falso ni agujero', async () => {
    // El SIGKILL cae antes del unico JSON del CLI. Escribir cero diria que
    // quince minutos salieron gratis; no escribir nada los volvia invisibles.
    // La fila entra marcada como no medida, y por eso hay id que citar.
    const b = bench({ timedOut: true })
    await generateFix(b.context, 'prop-1', b.deps)

    expect(b.events.some((e) => e.eventType === 'AGENT_RUN')).toBe(true)
    expect(b.runs).toHaveLength(1)
    expect(b.runs[0].usage).toBeUndefined()
    expect(b.runs[0].durationMs).toBe(900_000)
  })

  it('CONSERVA el worktree: hay medio fix que mirar', async () => {
    const b = bench({ timedOut: true })
    await generateFix(b.context, 'prop-1', b.deps)
    expect(b.calls).not.toContain('remove')
  })

  it('el detalle dice que fue el plazo, no un codigo de salida', async () => {
    const b = bench({ timedOut: true })
    expect(await generateFix(b.context, 'prop-1', b.deps)).toMatchObject({
      detail: expect.stringContaining('timeout tras 15 min') as unknown as string
    })
  })
})
