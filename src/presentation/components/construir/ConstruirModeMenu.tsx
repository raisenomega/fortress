import { useEffect, useRef } from 'react'
import type { ConstruirMode } from '../../stores/construir-store'

interface MenuProps {
  readonly current: ConstruirMode
  readonly onPick: (mode: ConstruirMode) => void
  readonly onClose: () => void
}

const MODES: ReadonlyArray<{ mode: ConstruirMode; label: string; hint: string }> = [
  { mode: 'plan', label: 'Plan', hint: 'disena un plan (solo lectura)' },
  { mode: 'investigacion', label: 'Investigacion', hint: 'responde, no toca nada' },
  { mode: 'ejecutor', label: 'Ejecutor', hint: 'construye el plan revisado' },
  { mode: 'libre', label: 'Chat libre', hint: 'global, sin proyecto · conversa sin repo' },
  { mode: 'cto', label: 'CTO', hint: 'piensa y mide, nunca firma' }
]

/** Indice destino para flechas/Home/End (circular), o null si la tecla no navega. */
function destino(key: string, i: number, n: number): number | null {
  if (key === 'ArrowDown') return (i + 1) % n
  if (key === 'ArrowUp') return (i - 1 + n) % n
  if (key === 'Home') return 0
  return key === 'End' ? n - 1 : null
}

/** Menu que abre la flecha: elige el modo activo (no envia; el envio es aparte). */
export function ConstruirModeMenu({ current, onPick, onClose }: MenuProps): React.JSX.Element {
  const items = useRef<Array<HTMLButtonElement | null>>([])
  const activo = Math.max(0, MODES.findIndex((m) => m.mode === current))
  useEffect(() => items.current[activo]?.focus(), [activo])

  const alPulsar = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
      return
    }
    const i = items.current.findIndex((b) => b === document.activeElement)
    const j = destino(e.key, i < 0 ? activo : i, MODES.length)
    if (j === null) return
    e.preventDefault()
    items.current[j]?.focus()
  }

  return (
    <div
      role="menu"
      aria-label="Modo"
      onKeyDown={alPulsar}
      className="absolute right-0 bottom-11 w-56 rounded-md border border-border bg-background p-1 shadow-lg"
    >
      {MODES.map((m, i) => (
        <button
          key={m.mode}
          ref={(el) => {
            items.current[i] = el
          }}
          type="button"
          role="menuitemradio"
          aria-checked={m.mode === current}
          tabIndex={i === activo ? 0 : -1}
          onClick={() => onPick(m.mode)}
          className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-primary/10 focus:bg-primary/10 ${
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
