import type { Finding } from '@domain/project/project'
import type { Proposal, ProposalState } from '@domain/repair/proposal'
import type { IconName } from '@domain/shared/icon-name'
import { formatMoment } from '../../format/time'
import { Icon } from '../common/Icon'

interface RepairProposalRowProps {
  readonly proposal: Proposal
  /** El hallazgo detras de la propuesta, si sigue en la base. */
  readonly finding: Finding | undefined
}

/** Solo los estados que I1 produce llevan glifo propio; el resto cae a circulo. */
const STATE_ICON: Partial<Record<ProposalState, IconName>> = {
  ELEGIDO: 'circle',
  ANALIZADO: 'check-circle',
  CADUCADO: 'x-circle'
}

const STATE_TONE: Partial<Record<ProposalState, string>> = {
  ELEGIDO: 'text-medium',
  ANALIZADO: 'text-success',
  CADUCADO: 'text-muted-foreground'
}

export function RepairProposalRow({
  proposal,
  finding
}: RepairProposalRowProps): React.JSX.Element {
  const donde = finding
    ? `${finding.severity} ${finding.file}${finding.line === null ? '' : `:${finding.line}`}`
    : `hallazgo ${proposal.findingId.slice(0, 6)}`
  const tone = STATE_TONE[proposal.state] ?? 'text-foreground'

  return (
    <div className="flex items-center gap-2 rounded border border-border px-2 py-1 text-xs">
      <span className={tone}>
        <Icon name={STATE_ICON[proposal.state] ?? 'circle'} size={12} />
      </span>
      <span className="font-mono text-muted-foreground">{proposal.id.slice(0, 6)}</span>
      <span className="min-w-0 flex-1 truncate text-foreground">{donde}</span>
      <span className={`shrink-0 ${tone}`}>
        {proposal.state}
        {proposal.analysisVerdict === undefined ? '' : ` (${proposal.analysisVerdict})`}
      </span>
      <span className="shrink-0 text-muted-foreground">
        {formatMoment(new Date(proposal.updatedAt).toISOString())}
      </span>
    </div>
  )
}
