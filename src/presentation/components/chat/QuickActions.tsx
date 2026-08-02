import { QUICK_ACTIONS } from '@domain/chat/quick-actions'
import { useRunMeterStore } from '../../stores/run-meter-store'
import { Icon } from '../common/Icon'
import { UsageIndicator } from '../layout/UsageIndicator'
import { RunMeter } from './RunMeter'

interface QuickActionsProps {
  readonly disabled: boolean
  readonly onPick: (prompt: string) => void
}

/**
 * Los atajos a la izquierda; el consumo de la sesion, al otro extremo. Vive
 * aqui y no en el pie porque es donde el operador dispara el trabajo: ve lo
 * que lleva gastado justo al lado del boton que lo gasta.
 */
export function QuickActions({ disabled, onPick }: QuickActionsProps): React.JSX.Element {
  // Mientras corre, la frase en vivo (agentes/tiempo/gasto); parado, la sesion.
  const running = useRunMeterStore((state) => state.startedAt !== null)

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(action.prompt)}
            className="tap flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-40"
          >
            <Icon name={action.iconName} size={12} />
            {action.label}
          </button>
        ))}
      </div>
      {running ? <RunMeter /> : <UsageIndicator />}
    </div>
  )
}
