import type { AttentionZone } from '@domain/cognition/cognition-log'

interface AttentionMapProps {
  readonly zones: readonly AttentionZone[]
}

/** Cuanto mas pesa la zona, mas caliente el color. */
function barClass(weight: number): string {
  if (weight >= 0.8) return 'bg-critical'
  if (weight >= 0.5) return 'bg-medium'
  return 'bg-low'
}

export function AttentionMap({ zones }: AttentionMapProps): React.JSX.Element {
  if (zones.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Sin mapa de atencion. Lo escribe COGNITION en el log despues del primer scan.
      </p>
    )
  }

  return (
    <ul className="space-y-1.5">
      {zones.map((zone) => (
        <li key={zone.zone} className="flex items-center gap-2">
          <span className="w-40 shrink-0 truncate font-mono text-[11px] text-foreground">
            {zone.zone}
          </span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <span
              className={`block h-full rounded-full ${barClass(zone.weight)}`}
              style={{ width: `${Math.round(zone.weight * 100)}%` }}
            />
          </span>
          <span className="w-9 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
            {zone.weight.toFixed(2)}
          </span>
          <span className="hidden w-56 shrink-0 truncate text-[11px] text-muted-foreground lg:block">
            {zone.reason}
          </span>
        </li>
      ))}
    </ul>
  )
}
