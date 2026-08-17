import { describe, expect, it } from 'vitest'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import { collectGateOutcome } from './collect-gate-outcome'

const corrida = (command: string, exitCode = 0): ProposalEvent =>
  ({
    proposalId: 'p1',
    seq: 1,
    phase: 'GATE',
    eventType: 'AGENT_RUN',
    durationMs: 10,
    evidenceJson: JSON.stringify({ command, exitCode, stdoutTail: '', stderrTail: '' })
  }) as unknown as ProposalEvent

const cierre = (toState: 'GATE' | 'RECHAZADO', evidencia: object): ProposalEvent =>
  ({
    proposalId: 'p1',
    seq: 9,
    phase: 'GATE',
    eventType: 'TRANSITION',
    toState,
    reason: 'gate verde',
    evidenceJson: JSON.stringify(evidencia)
  }) as unknown as ProposalEvent

describe('collectGateOutcome: lo que el libro conserva del juicio', () => {
  it('reune los comandos y el veredicto del cierre', () => {
    const outcome = collectGateOutcome([corrida('npm ci'), corrida('lint'), cierre('GATE', {})])
    expect(outcome).toMatchObject({ ok: true })
    expect(outcome?.commands.map((c) => c.command)).toEqual(['npm ci', 'lint'])
  })

  it('recupera lo que NO se verifico cuando el asiento lo cuenta', () => {
    const eventos = [corrida('npm ci'), corrida('lint'), cierre('GATE', { skipped: ['typecheck'] })]
    expect(collectGateOutcome(eventos)?.skipped).toEqual(['typecheck'])
  })

  it('un asiento que no lo cuenta no se convierte en "no hubo saltos"', () => {
    const outcome = collectGateOutcome([corrida('npm ci'), corrida('lint'), cierre('GATE', {})])
    expect(outcome?.skipped).toBeUndefined()
  })

  it('tambien lo recupera de un cierre en rojo', () => {
    const eventos = [
      corrida('npm ci'),
      corrida('lint', 1),
      cierre('RECHAZADO', { skipped: ['typecheck', 'test:unit'] })
    ]
    const outcome = collectGateOutcome(eventos)
    expect(outcome).toMatchObject({ ok: false, failedAt: 'lint' })
    expect(outcome?.skipped).toEqual(['typecheck', 'test:unit'])
  })

  it('una lista que no es de textos se ignora en vez de colarse', () => {
    const eventos = [corrida('npm ci'), cierre('GATE', { skipped: [1, 2] })]
    expect(collectGateOutcome(eventos)?.skipped).toBeUndefined()
  })

  it('sin cierre no hay juicio que reunir', () => {
    expect(collectGateOutcome([corrida('npm ci')])).toBeNull()
  })
})
