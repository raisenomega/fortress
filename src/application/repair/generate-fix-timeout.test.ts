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

  it('NO asienta una corrida de cero dolares', async () => {
    // El SIGKILL cae antes del unico JSON del CLI, asi que no hay factura que
    // leer. Escribirla en cero diria que quince minutos salieron gratis, y el
    // libro mayor prefiere no tener la fila a tener una falsa.
    const b = bench({ timedOut: true })
    await generateFix(b.context, 'prop-1', b.deps)

    expect(b.events.some((e) => e.eventType === 'AGENT_RUN')).toBe(true)
    expect(b.events.every((e) => e.agentRunId === undefined)).toBe(true)
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
