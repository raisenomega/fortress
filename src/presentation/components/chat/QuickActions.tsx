import { QUICK_ACTIONS } from '@domain/chat/quick-actions'

interface QuickActionsProps {
  readonly disabled: boolean
  readonly onPick: (prompt: string) => void
}

export function QuickActions({ disabled, onPick }: QuickActionsProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-1.5">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(action.prompt)}
          className="tap rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-40"
        >
          {action.icon} {action.label}
        </button>
      ))}
    </div>
  )
}
