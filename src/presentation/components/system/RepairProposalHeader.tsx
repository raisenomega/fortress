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
  /** Las acciones de la propuesta, a la derecha de su estado. */
  readonly acciones?: React.ReactNode
}

/**
 * La linea visible de una propuesta; el chevron abre su libro de vida.
 *
 * Era un `<button>` que envolvia la linea entera, y por eso las acciones caian
 * DEBAJO: HTML no anida un boton dentro de otro. Ahora la linea es un
 * contenedor y el boton de desplegar ocupa todo menos el hueco de las acciones,
 * asi que se sigue desplegando pinchando en cualquier parte del texto y el
 * boton de firmar cabe donde el operador lo busca — junto al estado que lo pide.
 */
export function RepairProposalHeader({
  proposal,
  finding,
  open,
  onToggle,
  acciones
}: RepairProposalHeaderProps): React.JSX.Element {
  const donde = sitio({ proposal, finding })
  const tone = STATE_TONE[proposal.state] ?? 'text-foreground'
  const lineage = retryLineage(proposal.analysisReason)

  return (
    <div className="flex w-full items-center gap-2 px-2 py-1 text-xs">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={12} />
        <span className={tone}>
          <Icon name={STATE_ICON[proposal.state] ?? 'circle'} size={12} />
        </span>
        <span className="text-muted-foreground font-mono">{proposal.id.slice(0, 6)}</span>
        {lineage === null ? null : (
          <span className="border-border text-muted-foreground shrink-0 rounded border px-1 font-mono text-[10px]">
            retry de {lineage}
          </span>
        )}
        <span className="text-foreground min-w-0 flex-1 truncate">{donde}</span>
        <span className={`shrink-0 ${tone}`}>
          {proposal.state}
          {proposal.analysisVerdict === undefined ? '' : ` (${proposal.analysisVerdict})`}
        </span>
      </button>
      {acciones}
      <span className="text-muted-foreground shrink-0">
        {formatMoment(new Date(proposal.updatedAt).toISOString())}
      </span>
    </div>
  )
}
