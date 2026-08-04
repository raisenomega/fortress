export interface ProfileMetric {
  readonly label: string
  readonly value: string
  readonly percentil: string
}

interface OmegaMetricsTableProps {
  readonly metrics: readonly ProfileMetric[]
}

/**
 * Tabla de metricas del perfil (spec §3): Metrica · Valor · Tendencia · Percentil.
 * Tendencia sale 's/d': el sistema no guarda serie historica de metricas y OMEGA
 * no dibuja una flecha inventada. Valor y percentil son reales.
 */
export function OmegaMetricsTable({ metrics }: OmegaMetricsTableProps): React.JSX.Element {
  const head = ['Metrica', 'Valor', 'Tendencia', 'Percentil']
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border text-muted-foreground">
          {head.map((h, i) => (
            <th key={h} className={`px-2 py-1 font-medium ${i === 0 ? 'text-left' : 'text-right'}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {metrics.map((m) => (
          <tr key={m.label} className="border-b border-border">
            <td className="px-2 py-1 text-foreground">{m.label}</td>
            <td className="px-2 py-1 text-right text-foreground">{m.value}</td>
            <td className="px-2 py-1 text-right text-muted-foreground" title="Sin serie historica">
              s/d
            </td>
            <td className="px-2 py-1 text-right text-muted-foreground">{m.percentil}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
