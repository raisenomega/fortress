import type { OmegaOverview } from '@domain/omega/omega-overview'

interface OmegaAlertsProps {
  readonly overview: OmegaOverview
}

/**
 * Alertas por severidad, con datos REALES del Libro de la Vida: rojo = lo que no
 * cuadra (discrepancias + vetos), amarillo = notas informativas, verde = lo
 * verificado correcto. Sin cifras inventadas.
 */
export function OmegaAlerts({ overview }: OmegaAlertsProps): React.JSX.Element {
  const rojo = overview.discrepancies + overview.vetos
  const chips: ReadonlyArray<readonly [string, number, string]> = [
    ['critico', rojo, 'text-critical'],
    ['aviso', overview.infos, 'text-medium'],
    ['ok', overview.oks, 'text-success']
  ]

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-muted-foreground">Alertas:</span>
      {chips.map(([label, value, tone]) => (
        <span key={label} className={`flex items-center gap-1 ${tone}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {value} {label}
        </span>
      ))}
    </div>
  )
}
