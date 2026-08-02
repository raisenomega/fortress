export interface Bar {
  readonly label: string
  readonly value: number
  /** Clase de color del tema; nunca un color literal. */
  readonly className: string
}

interface BarChartProps {
  readonly bars: readonly Bar[]
  readonly empty: string
}

/** Barras horizontales en HTML: cuatro divs no justifican una libreria. */
export function BarChart({ bars, empty }: BarChartProps): React.JSX.Element {
  const max = Math.max(...bars.map((bar) => bar.value), 0)

  if (max === 0) return <p className="text-xs text-muted-foreground">{empty}</p>

  return (
    <ul className="space-y-1.5">
      {bars.map((bar) => (
        <li key={bar.label} className="flex items-center gap-2">
          <span className="w-20 shrink-0 font-mono text-[10px] text-muted-foreground">
            {bar.label}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <span
              className={`block h-full rounded-full ${bar.className}`}
              style={{ width: `${Math.round((bar.value / max) * 100)}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-mono text-[11px] text-foreground">
            {bar.value}
          </span>
        </li>
      ))}
    </ul>
  )
}
