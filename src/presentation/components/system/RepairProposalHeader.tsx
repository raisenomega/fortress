import type { Finding } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'
import { formatMoment } from '../../format/time'
import { Icon } from '../common/Icon'
import { retryLineage, STATE_ICON, STATE_TONE } from './repair-proposal-badges'
import { sitio } from './cola-de-firma'

interface RepairProposalHeaderProps {
  readonly proposal: Proposal
  readonly finding: Finding | undefined
  readonly open: boolean
  readonly onToggle: () => void
}

/** La linea visible de una propuesta; el chevron abre su libro de vida. */
export function RepairProposalHeader({
  proposal,
  finding,
  open,
  onToggle
}: RepairProposalHeaderProps): React.JSX.Element {
  // La misma linea que leia la cola de firma, no una copia suya: la cola vive
  // ahora en estas filas, y dos formas de escribir el mismo sitio se separan.
  const donde = sitio({ proposal, finding })
  const tone = STATE_TONE[proposal.state] ?? 'text-foreground'
  const lineage = retryLineage(proposal.analysisReason)

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 px-2 py-1 text-left text-xs"
    >
      <Icon name={open ? 'chevron-down' : 'chevron-right'} size={12} />
      <span className={tone}>
        <Icon name={STATE_ICON[proposal.state] ?? 'circle'} size={12} />
      </span>
      <span className="font-mono text-muted-foreground">{proposal.id.slice(0, 6)}</span>
      {lineage === null ? null : (
        <span className="border-border text-muted-foreground shrink-0 rounded border px-1 font-mono text-[10px]">
          retry de {lineage}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-foreground">{donde}</span>
      <span className={`shrink-0 ${tone}`}>
        {proposal.state}
        {proposal.analysisVerdict === undefined ? '' : ` (${proposal.analysisVerdict})`}
      </span>
      <span className="shrink-0 text-muted-foreground">
        {formatMoment(new Date(proposal.updatedAt).toISOString())}
      </span>
    </button>
  )
}
