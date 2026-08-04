import { QUICK_ACTIONS } from '@domain/chat/quick-actions'
import { Icon } from '../common/Icon'

interface QuickActionsProps {
  readonly disabled: boolean
  readonly onPick: (prompt: string) => void
}

/**
 * Atajos del chat. El consumo (agentes/tiempo/tokens) ya no vive aqui: se
 * movio al pie para verlo desde cualquier pantalla, no solo en el chat.
 */
export function QuickActions({ disabled, onPick }: QuickActionsProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-1.5">
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
  )
}
