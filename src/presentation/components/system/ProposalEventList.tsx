import type { ProposalEvent } from '@domain/repair/proposal-event'
import { desacuerdoDe } from './desacuerdo-de-omega'
import { ProposalEventRow } from './ProposalEventRow'

interface ProposalEventListProps {
  readonly events: readonly ProposalEvent[]
}

/** La cadena del libro de vida, en orden cronologico (seq). */
export function ProposalEventList({ events }: ProposalEventListProps): React.JSX.Element {
  if (events.length === 0) {
    return <p className="text-muted-foreground px-2 py-1 text-[11px]">Sin eventos registrados.</p>
  }
  const desacuerdo = desacuerdoDe(events)
  return (
    <div className="space-y-1 px-2 py-1">
      {events.map((event) => (
        <ProposalEventRow key={event.id} event={event} desacuerdo={desacuerdo} />
      ))}
    </div>
  )
}
