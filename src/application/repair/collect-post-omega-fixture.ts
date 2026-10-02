import { MOTIVO_WORKTREE } from '@domain/repair/motivo-del-worktree'
import type { EventPhase, EventType, ProposalEvent } from '@domain/repair/proposal-event'

let seq = 0

/** Un evento del libro con lo minimo: fase, tipo y su evidencia. */
export function evento(
  phase: EventPhase,
  eventType: EventType,
  evidence: object | null,
  extra: Partial<ProposalEvent> = {}
): ProposalEvent {
  seq += 1
  return {
    id: `e${seq}`, proposalId: 'p-1', seq, phase, eventType, actor: 'motor', ts: seq,
    ...(evidence === null ? {} : { evidenceJson: JSON.stringify(evidence) }), ...extra
  } // prettier-ignore
}

export const VERDICT = {
  resuelve_el_hallazgo: 'SI', respeta_scope: 'SI', respeta_doNotTouch: 'SI',
  calidad_del_diff: 'BUENO', riesgo_residual: 'MENOR', veredicto_global: 'APROBADO',
  razon: 'fix minimo'
} as const // prettier-ignore

/**
 * La cadena completa de una propuesta que llego al veredicto aprobado.
 *
 * EL ASIENTO DEL WORKTREE LLEVA SU MOTIVO, como en el libro de verdad. No lo
 * llevaba, y esa infidelidad del fixture es lo que dejo pasar la regresion de
 * DEUDAS §13: ningun test podia notar que la firma cogia «el ultimo DECISION»
 * si en el fixture no habia mas que uno y encima sin motivo que lo distinguiera.
 * Un doble que no se parece al original no prueba lo que dice probar.
 */
export function cadenaCompleta(): ProposalEvent[] {
  return [
    evento('GENERATE', 'DECISION', { worktreePath: '/wt/p-1', branch: 'repair/p-1-slug', baseSha: 'base123', ok: true }, { reason: MOTIVO_WORKTREE }), // prettier-ignore
    evento('GENERATE', 'TRANSITION', { commitSha: 'fix9876', files: ['src/a.ts'], insertions: 6, deletions: 2 }), // prettier-ignore
    evento('GATE', 'AGENT_RUN', { command: 'npm ci', exitCode: 0, stdoutTail: 'ok', stderrTail: '', timedOut: false }, { durationMs: 29_000 }), // prettier-ignore
    evento('GATE', 'AGENT_RUN', { command: 'lint', exitCode: 0, stdoutTail: 'ok', stderrTail: '', timedOut: false }, { durationMs: 35_000 }), // prettier-ignore
    evento('GATE', 'TRANSITION', { allCommandsGreen: true, totalDurationMs: 64_000 }, { toState: 'GATE' }), // prettier-ignore
    evento('OMEGA', 'TRANSITION', { verdict: VERDICT }, { toState: 'OMEGA' })
  ]
}

/**
 * La cadena de una propuesta con DOS vueltas del lazo (ADR-110): el primer gate
 * cierra, OMEGA aprueba un PARCIAL, el generador da otra vuelta y el gate vuelve
 * a correr con comandos DISTINTOS. Es la forma que el libro tiene desde que la
 * arista existe, y la que destapa leer el cierre por posicion (§6 del ADR).
 */
export function cadenaConDosVueltas(): ProposalEvent[] {
  return [
    ...cadenaCompleta(),
    evento('GENERATE', 'TRANSITION', { commitSha: 'fix2222', files: ['src/a.ts'], insertions: 9, deletions: 1 }), // prettier-ignore
    evento('GATE', 'AGENT_RUN', { command: 'npm ci', exitCode: 0, stdoutTail: 'ok2', stderrTail: '', timedOut: false }, { durationMs: 31_000 }), // prettier-ignore
    evento('GATE', 'AGENT_RUN', { command: 'typecheck', exitCode: 0, stdoutTail: 'ok2', stderrTail: '', timedOut: false }, { durationMs: 12_000 }), // prettier-ignore
    evento('GATE', 'TRANSITION', { allCommandsGreen: true, totalDurationMs: 43_000 }, { toState: 'GATE' }), // prettier-ignore
    evento('OMEGA', 'TRANSITION', { verdict: { ...VERDICT, razon: 'ahora si, completo' } }, { toState: 'OMEGA' }) // prettier-ignore
  ]
}

/** La cadena sin los eventos de una fase y tipo concretos. */
export function cadenaSin(phase: EventPhase, eventType: EventType): ProposalEvent[] {
  return cadenaCompleta().filter((e) => !(e.phase === phase && e.eventType === eventType))
}
