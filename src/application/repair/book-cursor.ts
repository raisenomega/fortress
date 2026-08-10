import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalEventLog } from './proposal-event-log'

/** Cursor de seq del libro: cada emision avanza uno. Nace de la cadena leida. */
export interface BookCursor {
  seq: number
}

export function cursorFrom(events: readonly ProposalEvent[]): BookCursor {
  return { seq: events.reduce((top, event) => Math.max(top, event.seq), 0) + 1 }
}

export function next(cursor: BookCursor): number {
  const seq = cursor.seq
  cursor.seq += 1
  return seq
}

/** Telemetria, no gate: un fallo del libro se anota y el motor sigue. */
export async function safeRecord(log: ProposalEventLog, event: ProposalEvent): Promise<void> {
  try {
    await log.record(event)
  } catch (error) {
    console.error('proposal_events: fallo al asentar un evento', error)
  }
}
