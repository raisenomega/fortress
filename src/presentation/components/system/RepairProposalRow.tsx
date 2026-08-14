import { useState } from 'react'
import type { Finding } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import { api } from '../../adapters/fortress-api'
import { ExpandableText } from '../common/ExpandableText'
import { ProposalEventList } from './ProposalEventList'
import { RepairGateButton } from './RepairGateButton'
import { RepairGenerateButton } from './RepairGenerateButton'
import { RepairOmegaButton } from './RepairOmegaButton'
import { RepairProposalHeader } from './RepairProposalHeader'
import { reasonBody } from './repair-proposal-badges'
import { RepairRetryButton } from './RepairRetryButton'

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

  const loadEvents = async (): Promise<void> => {
    setEvents(await api().repair.events(proposal.id))
  }
  const toggle = async (): Promise<void> => {
    if (!open) await loadEvents()
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
      {/* Fuera del boton de la cabecera: un boton no puede anidar otro. */}
      <ExpandableText
        text={reasonBody(proposal.analysisReason)}
        className="text-muted-foreground px-2 pb-1 text-[11px]"
      />
      {/* Si la fila esta abierta al terminar la generacion, el libro se refresca. */}
      <RepairGenerateButton proposal={proposal} onDone={() => open && void loadEvents()} />
      <RepairGateButton proposal={proposal} onDone={() => open && void loadEvents()} />
      {/* Refetch incondicional: sin stale closure (leccion I3.1). */}
      <RepairOmegaButton proposal={proposal} onDone={() => void loadEvents()} />
      <RepairRetryButton proposal={proposal} onDone={() => void loadEvents()} />
      {open ? <ProposalEventList events={events} /> : null}
    </div>
  )
}
