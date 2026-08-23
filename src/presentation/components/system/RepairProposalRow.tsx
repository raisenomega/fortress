import { useState } from 'react'
import type { Finding } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import { api } from '../../adapters/fortress-api'
import { ExpandableText } from '../common/ExpandableText'
import { ProposalEventList } from './ProposalEventList'
import { RepairFirmaButton } from './RepairFirmaButton'
import { RepairGateButton } from './RepairGateButton'
import { RepairGenerateButton } from './RepairGenerateButton'
import { RepairProposalHeader } from './RepairProposalHeader'
import { reasonBody } from './repair-proposal-badges'
import { RepairRetryButton } from './RepairRetryButton'

interface RepairProposalRowProps {
  readonly proposal: Proposal
  /** El hallazgo detras de la propuesta, si sigue en la base. */
  readonly finding: Finding | undefined
}

/**
 * Fila del expediente. Expandirla carga y muestra su libro de vida.
 *
 * En reposo es UNA linea. La razon del analisis viaja dentro del desplegable
 * porque ronda los mil caracteres: pintada siempre, aunque no la mires, hacia
 * que veinte propuestas no cupieran en la pantalla. Quien la quiere leer es
 * quien ya abrio la fila, y ahi la tiene junto al libro.
 */
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

  // Cada boton se pinta solo si el estado es el suyo, asi que la fila lleva
  // como mucho uno. Refetch incondicional al terminar: sin stale closure (I3.1).
  const acciones = (
    <>
      <RepairGenerateButton proposal={proposal} onDone={() => open && void loadEvents()} />
      <RepairGateButton proposal={proposal} onDone={() => open && void loadEvents()} />
      <RepairFirmaButton proposal={proposal} onDone={() => void loadEvents()} />
      <RepairRetryButton proposal={proposal} onDone={() => void loadEvents()} />
    </>
  )

  return (
    <div className="border-border rounded border">
      <RepairProposalHeader
        proposal={proposal}
        finding={finding}
        open={open}
        onToggle={() => void toggle()}
        acciones={acciones}
      />
      {open ? (
        <>
          <ExpandableText
            text={reasonBody(proposal.analysisReason)}
            className="text-muted-foreground px-2 pb-1 text-[11px]"
          />
          <ProposalEventList events={events} />
        </>
      ) : null}
    </div>
  )
}
