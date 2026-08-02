import { OPERATION_MODES, type OperationMode } from '@domain/settings/operation-mode'
import { changeOperationMode } from '../../services/settings-service'
import { useSettingsStore } from '../../stores/settings-store'

const MODE_ICON: Record<OperationMode, string> = {
  supervisado: '👁',
  autonomo: '⚡'
}

const MODE_HINT: Record<OperationMode, string> = {
  supervisado: 'Propone los cambios y espera tu aprobacion',
  autonomo:
    'Aplica los cambios y reporta. Vuelve a supervisado solo en auth, payments, RLS y seguridad'
}

/** El modo elegido se persiste y viaja en el system prompt de cada peticion. */
export function ModeSelector(): React.JSX.Element {
  const mode = useSettingsStore((state) => state.mode)

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-input p-0.5">
      {OPERATION_MODES.map((option) => (
        <button
          key={option}
          type="button"
          title={MODE_HINT[option]}
          onClick={() => void changeOperationMode(option)}
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
