export interface Highlight {
  readonly label: string
  /** 0-100 o null (sin dato). */
  readonly value: number | null
  readonly tone: string
}

interface OmegaHighlightsProps {
  readonly items: readonly Highlight[]
}

/** 3 barras de destacados en la misma linea (patron del spec). Valores reales. */
export function OmegaHighlights({ items }: OmegaHighlightsProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <p className="flex justify-between text-[10px] tracking-wide text-muted-foreground uppercase">
            <span>{item.label}</span>
            <span>{item.value === null ? 's/d' : `${item.value}%`}</span>
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.value ?? 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
