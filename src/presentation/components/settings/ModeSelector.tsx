import { OPERATION_MODES, type OperationMode } from '@domain/settings/operation-mode'
import { useSettingsStore } from '../../stores/settings-store'

const MODE_ICON: Record<OperationMode, string> = {
  supervisado: '👁',
  autonomo: '⚡'
}

/** Selector del modo de operacion. La persistencia se conecta en el paso 10. */
export function ModeSelector(): React.JSX.Element {
  const mode = useSettingsStore((state) => state.mode)
  const setMode = useSettingsStore((state) => state.setMode)

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-input p-0.5">
      {OPERATION_MODES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setMode(option)}
          aria-pressed={mode === option}
          className={`tap rounded px-2 py-1 text-xs capitalize ${
            mode === option
              ? 'bg-primary font-semibold text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {MODE_ICON[option]} {option}
        </button>
      ))}
    </div>
  )
}
