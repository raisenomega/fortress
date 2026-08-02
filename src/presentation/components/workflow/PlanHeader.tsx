import { describeDuration, type WorkflowEstimate } from '@domain/workflow/workflow-estimate'
import { Icon } from '../common/Icon'

interface PlanHeaderProps {
  readonly label: string
  readonly estimate: WorkflowEstimate
}

/** El coste va en la cabecera, no escondido: es dinero y minutos reales. */
export function PlanHeader({ label, estimate }: PlanHeaderProps): React.JSX.Element {
  return (
    <header className="flex flex-wrap items-center gap-2">
      <Icon name="sparkles" size={14} className="text-primary" />
      <h3 className="font-display text-sm font-bold text-foreground">{label}</h3>
      <span
        title="Estimacion medida sobre escaneos reales de este proyecto"
        className="ml-auto font-mono text-[11px] text-muted-foreground"
      >
        {estimate.steps} agentes · {describeDuration(estimate.seconds)} · ~$
        {estimate.usd.toFixed(2)}
      </span>
    </header>
  )
}
