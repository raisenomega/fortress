import type { EventPhase, ProposalEvent } from '@domain/repair/proposal-event'
import type { IconName } from '@domain/shared/icon-name'

export const PHASE_ICON: Record<EventPhase, IconName> = {
  SELECT: 'circle',
  ANALYZE: 'search',
  GENERATE: 'wrench',
  GATE: 'check-circle',
  OMEGA: 'eye',
  APPROVE: 'check-circle',
  MERGE: 'git-merge',
  EXPIRE: 'x-circle'
}

/** El AGENT_RUN de un comando del gate pinta verde o rojo segun su exitCode. */
export function iconDe(event: ProposalEvent): IconName {
  if (event.phase === 'GATE' && event.eventType === 'AGENT_RUN') {
    try {
      const exitCode = (JSON.parse(event.evidenceJson ?? '{}') as { exitCode?: number }).exitCode
      return exitCode === 0 ? 'check-circle' : 'x-circle'
    } catch {
      return PHASE_ICON[event.phase]
    }
  }
  return PHASE_ICON[event.phase]
}
