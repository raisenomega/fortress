import type { AbSide, GraphAb } from '@domain/graph/graph-actions'
import { formatTokens } from '@domain/telemetry/format-usage'

interface RowProps {
  readonly label: string
  readonly side: AbSide
  readonly tone: string
}

function Row({ label, side, tone }: RowProps): React.JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
      <span className={tone}>{label}</span>
      <span className="text-foreground">
        {formatTokens(side.tokens)} tok · ${side.costUsd.toFixed(3)}
        {side.answered ? '' : ' · sin respuesta'}
      </span>
    </div>
  )
}

/** Los dos lados del A/B con sus tokens: lectura (solo grafo) vs normal (grafo+read). */
export function GraphAbResult({ ab }: { ab: GraphAb }): React.JSX.Element {
  return (
    <div className="space-y-1 rounded-md border border-border p-2">
      <Row label="lectura · solo grafo" side={ab.lectura} tone="text-primary" />
      <Row label="normal · grafo+read" side={ab.normal} tone="text-muted-foreground" />
    </div>
  )
}
