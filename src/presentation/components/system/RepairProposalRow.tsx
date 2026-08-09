import { useState } from 'react'
import type { Finding } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import { api } from '../../adapters/fortress-api'
import { ProposalEventList } from './ProposalEventList'
import { RepairProposalHeader } from './RepairProposalHeader'

interface RepairProposalRowProps {
  readonly proposal: Proposal
  /** El hallazgo detras de la propuesta, si sigue en la base. */
  readonly finding: Finding | undefined
}

/** Fila del expediente. Expandirla carga y muestra su libro de vida. */
export function RepairProposalRow({
  proposal,
  finding
}: RepairProposalRowProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [events, setEvents] = useState<readonly ProposalEvent[]>([])

  const toggle = async (): Promise<void> => {
    if (!open) setEvents(await api().repair.events(proposal.id))
    setOpen(!open)
  }

  return (
    <div className="border-border rounded border">
      <RepairProposalHeader
        proposal={proposal}
        finding={finding}
        open={open}
        onToggle={() => void toggle()}
      />
      {open ? <ProposalEventList events={events} /> : null}
    </div>
  )
}
