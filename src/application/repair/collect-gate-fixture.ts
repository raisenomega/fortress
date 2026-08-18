import type { ProposalEvent } from '@domain/repair/proposal-event'

/** Un AGENT_RUN del gate tal y como lo deja el libro. */
export const corrida = (command: string, exitCode = 0): ProposalEvent =>
  ({
    proposalId: 'p1',
    seq: 1,
    phase: 'GATE',
    eventType: 'AGENT_RUN',
    durationMs: 10,
    evidenceJson: JSON.stringify({ command, exitCode, stdoutTail: '', stderrTail: '' })
  }) as unknown as ProposalEvent

/** El cierre del gate: es quien dicta el veredicto que se reconstruye. */
export const cierre = (toState: 'GATE' | 'RECHAZADO', evidencia: object): ProposalEvent =>
  ({
    proposalId: 'p1',
    seq: 9,
    phase: 'GATE',
    eventType: 'TRANSITION',
    toState,
    reason: 'gate verde',
    evidenceJson: JSON.stringify(evidencia)
  }) as unknown as ProposalEvent
