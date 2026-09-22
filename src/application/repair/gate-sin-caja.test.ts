import { describe, expect, it } from 'vitest'
import { runGate } from './run-gate'
import { bench, cmd } from './run-gate-fixture'

/**
 * Sin caja no hay gate (ADR-092, casilla 4). Y el motivo se llama por su
 * nombre: `sin_caja` es del ENTORNO, no del fix. Sin esta guarda, `npm ci`
 * saldria 127 desde dentro de `spawnCommand` y el libro lo apuntaria como
 * `npm_ci_failed` — culpa del fix que no era suya.
 */
describe('el gate no corre sin la caja, y lo dice como lo que es', () => {
  it('sin bwrap: RECHAZADO con `sin_caja`, y el runner no llega a correr', async () => {
    const b = bench({ trusted: true })
    let corrio = false
    const runner = { run: () => { corrio = true; return Promise.resolve({ ok: true as const, commands: [cmd('npm ci')] }) } } // prettier-ignore
    const deps = {
      ...b.deps,
      runner,
      hayCaja: () => ({ ok: false as const, error: 'falta-bwrap' })
    }

    const salida = await runGate(b.context, 'prop-1', deps)

    expect(salida).toEqual({ ok: false, reason: 'sin_caja' })
    expect(corrio).toBe(false)
    expect(b.patches.at(-1)).toMatchObject({ state: 'RECHAZADO', analysisReason: 'sin_caja' })
  })

  it('el porque de la caja queda en la evidencia del rechazo', async () => {
    const b = bench({ trusted: true })
    await runGate(b.context, 'prop-1', { ...b.deps, hayCaja: () => ({ ok: false as const, error: 'falta-socat' }) }) // prettier-ignore
    const evento = b.events.at(-1) as { toState: string; evidenceJson: string }
    expect(evento.toState).toBe('RECHAZADO')
    expect(JSON.parse(evento.evidenceJson)).toMatchObject({ motivo: 'falta-socat' })
  })

  it('la caja se pregunta DESPUES de la confianza: sin confianza manda la confianza', async () => {
    const b = bench({ trusted: false })
    const salida = await runGate(b.context, 'prop-1', { ...b.deps, hayCaja: () => ({ ok: false as const, error: 'falta-bwrap' }) }) // prettier-ignore
    expect(salida).toEqual({ ok: false, reason: 'proyecto_sin_confianza' })
  })
})
