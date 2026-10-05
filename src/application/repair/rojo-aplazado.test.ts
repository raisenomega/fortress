import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { GateOutcome } from '@domain/repair/gate-result'
import { bench, cmd } from './run-gate-fixture'
import { rechazarAplazado } from './rojo-del-gate'
import { runGate } from './run-gate'
import { puedeDarLaVuelta } from '@domain/repair/lazo-del-motor'

/**
 * ADR-115 B2 (enmienda de ADR-110). Un rojo de CODIGO con lineas de error se
 * puede devolver al generador, asi que el gate APLAZA el rechazo: devuelve el
 * rojo y deja la propuesta en GENERADO. El rechazo no se deshace nunca: o el
 * lazo da su vuelta, o se escribe despues, identico al de siempre.
 */
const LINT_ROJO: GateOutcome = {
  ok: false, failedAt: 'lint', reason: 'gate_failed',
  commands: [cmd('npm ci'), cmd('typecheck'), { ...cmd('lint', 1), errores: ['/w/a.ts 76:1  error  File has too many lines (87)  max-lines'] }] // prettier-ignore
} // prettier-ignore

describe('el rechazo del rojo de codigo se aplaza, no se deshace', () => {
  it('con el modo aplazado: devuelve el rojo con su error y la propuesta sigue en GENERADO', async () => {
    const b = bench({ outcome: LINT_ROJO })
    const r = await runGate(b.context, 'prop-1', b.deps, { aplazarRojo: true })
    expect(r).toMatchObject({ ok: false, reason: 'gate_failed', aplazado: { failedAt: 'lint', errores: [expect.stringContaining('max-lines')] } }) // prettier-ignore
    expect(b.patches.some((p) => p.state === 'RECHAZADO')).toBe(false)
  })

  it('sin el modo (el boton «Gate» manual): rechaza igual que siempre', async () => {
    const b = bench({ outcome: LINT_ROJO })
    expect(await runGate(b.context, 'prop-1', b.deps)).toEqual({ ok: false, reason: 'gate_failed' })
    expect(b.patches.at(-1)).toMatchObject({
      state: 'RECHAZADO',
      analysisReason: 'gate_failed_at=lint'
    })
  })

  it('el boton manual no pide el modo aplazado', () => {
    const handler = readFileSync('src/infrastructure/ipc/repair-gate-handler.ts', 'utf8')
    expect(handler).toContain('runGate(context, proposal.id, buildGateDeps(proposal.projectId))')
  })

  it('el rechazo aplazado, cuando llega, es IDENTICO al de siempre', async () => {
    const siempre = bench({ outcome: LINT_ROJO })
    await runGate(siempre.context, 'prop-1', siempre.deps)
    const aplazado = bench({ outcome: LINT_ROJO })
    const r = await runGate(aplazado.context, 'prop-1', aplazado.deps, { aplazarRojo: true })
    if (r.ok || r.aplazado === undefined) throw new Error('no se aplazo')
    await rechazarAplazado(aplazado.context, 'prop-1', r.aplazado, 42)
    expect(aplazado.patches.at(-1)).toEqual(siempre.patches.at(-1))
    expect(aplazado.events.at(-1)?.evidenceJson).toBe(siempre.events.at(-1)?.evidenceJson)
  })

  it('y nunca reescribe una propuesta que ya es RECHAZADO', async () => {
    const b = bench({ state: 'RECHAZADO' })
    const a = { failedAt: 'lint', errores: ['x'], reason: 'gate_failed', detail: 'd', evidence: {} } as const // prettier-ignore
    expect(await rechazarAplazado(b.context, 'prop-1', a, 42)).toEqual({ ok: false, reason: 'invalid_state' }) // prettier-ignore
    expect(b.patches).toEqual([])
  })
})

describe('la vuelta tras el rojo entra por GENERADO, y solo cuando se pide', () => {
  it.each([
    ['GENERADO', 'GENERADO', true], ['OMEGA', 'OMEGA', true],
    ['GENERADO', 'OMEGA', false], ['RECHAZADO', 'GENERADO', false], ['RECHAZADO', 'OMEGA', false]
  ] as const)('estado %s, vuelta desde %s → %s', (estado, desde, si) => {
    expect(puedeDarLaVuelta(estado, desde)).toBe(si)
  }) // prettier-ignore
})
