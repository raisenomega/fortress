import type { ConstruirMode } from '../../stores/construir-store'

interface ConstruirModeMenuProps {
  readonly onPick: (mode: ConstruirMode) => void
}

const MODES: ReadonlyArray<{ mode: ConstruirMode; label: string; hint: string }> = [
  { mode: 'plan', label: 'Plan', hint: 'disena un plan (solo lectura)' },
  { mode: 'investigacion', label: 'Investigacion', hint: 'responde, no toca nada' },
  { mode: 'ejecutor', label: 'Ejecutor', hint: 'construye el plan revisado' }
]

/** Menu que abre la flecha: elige en que modo se envia el mensaje. */
export function ConstruirModeMenu({ onPick }: ConstruirModeMenuProps): React.JSX.Element {
  return (
    <div className="absolute right-0 bottom-12 w-56 rounded-md border border-border bg-background p-1 shadow-lg">
      {MODES.map((m) => (
        <button
          key={m.mode}
          type="button"
          onClick={() => onPick(m.mode)}
          className="block w-full rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-primary/10"
        >
          {m.label}
          <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
        </button>
      ))}
    </div>
  )
}
