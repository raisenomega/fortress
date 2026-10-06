import { describe, expect, it } from 'vitest'
import type { GateOutcome } from '@domain/repair/gate-result'
import { bench, cmd } from './run-gate-fixture'
import { runGate } from './run-gate'

/**
 * La evidencia de cada comando del gate en el libro guardaba cinco campos y no
 * las lineas de error de A1 ni la senal. La autopsia de 36d0061a tuvo que
 * rehacerse a mano: el libro decia «lint exit 1» y no decia por que.
 */
const evidenciaDe = (b: ReturnType<typeof bench>, comando: string): Record<string, unknown> =>
  JSON.parse(b.events.find((e) => e.reason === comando)?.evidenceJson ?? '{}') as Record<string, unknown> // prettier-ignore

describe('el libro guarda lo que dice por que cayo un comando', () => {
  it('las lineas de error de A1', async () => {
    const rojo: GateOutcome = { ok: false, failedAt: 'lint', reason: 'gate_failed', commands: [cmd('npm ci'), { ...cmd('lint', 1), errores: ['/w/a.ts 1:1  error  x  regla'] }] } // prettier-ignore
    const b = bench({ outcome: rojo })
    await runGate(b.context, 'prop-1', b.deps)
    expect(evidenciaDe(b, 'lint').errores).toEqual(['/w/a.ts 1:1  error  x  regla'])
  })

  it('la senal que lo mato', async () => {
    const detenido: GateOutcome = { ok: false, failedAt: 'lint', reason: 'gate_detenido', commands: [cmd('npm ci'), { ...cmd('lint', 1), senal: 'SIGTERM' }] } // prettier-ignore
    const b = bench({ outcome: detenido })
    await runGate(b.context, 'prop-1', b.deps)
    expect(evidenciaDe(b, 'lint').senal).toBe('SIGTERM')
  })

  it('un comando sin nada de eso se guarda igual que siempre', async () => {
    const b = bench()
    await runGate(b.context, 'prop-1', b.deps)
    expect(Object.keys(evidenciaDe(b, 'lint')).sort()).toEqual(['command', 'exitCode', 'stderrTail', 'stdoutTail', 'timedOut']) // prettier-ignore
  })
})
