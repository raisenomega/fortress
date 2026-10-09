import type { ConstruirMode } from '../../stores/construir-store'

interface ConstruirModeMenuProps {
  readonly current: ConstruirMode
  readonly onPick: (mode: ConstruirMode) => void
}

const MODES: ReadonlyArray<{ mode: ConstruirMode; label: string; hint: string }> = [
  { mode: 'plan', label: 'Plan', hint: 'disena un plan (solo lectura)' },
  { mode: 'investigacion', label: 'Investigacion', hint: 'responde, no toca nada' },
  { mode: 'ejecutor', label: 'Ejecutor', hint: 'construye el plan revisado' },
  { mode: 'libre', label: 'Chat libre', hint: 'global, sin proyecto · conversa sin repo' },
  { mode: 'cto', label: 'CTO', hint: 'piensa y mide, nunca firma · sin repo' }
]

/** Menu que abre la flecha: elige el modo activo (no envia; el envio es aparte). */
export function ConstruirModeMenu({ current, onPick }: ConstruirModeMenuProps): React.JSX.Element {
  return (
    <div className="absolute right-0 bottom-11 w-56 rounded-md border border-border bg-background p-1 shadow-lg">
      {MODES.map((m) => (
        <button
          key={m.mode}
          type="button"
          onClick={() => onPick(m.mode)}
          className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-primary/10 ${
            m.mode === current ? 'text-primary' : 'text-foreground'
          }`}
        >
          {m.label}
          <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
        </button>
      ))}
    </div>
  )
}
