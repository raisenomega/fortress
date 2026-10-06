import { describe, expect, it } from 'vitest'
import { hasBlockingRejection } from '@domain/repair/bloqueo-por-rechazo'
import type { GateOutcome } from '@domain/repair/gate-result'
import type { Proposal } from '@domain/repair/proposal'
import { bench, cmd } from './run-gate-fixture'
import { runGate } from './run-gate'

/**
 * Un gate detenido no juzga el fix: la propuesta queda CADUCADA, con la senal en
 * la evidencia, y el hallazgo vuelve a la baraja. RECHAZADA-por-lint era falso
 * (36d0061a), y ademas contaba en el freno de B1 contra un arreglo bueno.
 */
const DETENIDO: GateOutcome = { ok: false, failedAt: 'lint', reason: 'gate_detenido', commands: [cmd('npm ci'), { ...cmd('lint', 1), senal: 'SIGTERM' }] } // prettier-ignore

describe('el gate detenido deja la propuesta CADUCADA, no RECHAZADA', () => {
  it.each([[{}], [{ aplazarRojo: true }]])('con opciones %j', async (opciones) => {
    const b = bench({ outcome: DETENIDO })
    expect(await runGate(b.context, 'prop-1', b.deps, opciones)).toMatchObject({ ok: false, reason: 'gate_detenido' }) // prettier-ignore
    expect(b.patches.at(-1)).toMatchObject({ state: 'CADUCADO', analysisVerdict: 'REAL' })
    expect(b.patches.some((p) => p.state === 'RECHAZADO')).toBe(false)
    expect(b.events.at(-1)).toMatchObject({ toState: 'CADUCADO' })
    expect(b.events.at(-1)?.evidenceJson).toContain('SIGTERM')
  })

  it('y no cuenta en el freno de B1: el hallazgo vuelve a la baraja', () => {
    const caducada = { id: 'p', projectId: 'x', findingId: 'f1', baseSha: 'h', state: 'CADUCADO', analysisReason: 'gate_detenido: lint por SIGTERM', createdAt: 1, updatedAt: 1 } as Proposal // prettier-ignore
    expect(hasBlockingRejection('f1', 'h', [caducada], 'c')).toBe(false)
  })
})
