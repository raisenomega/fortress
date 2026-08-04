import type { GraphStats } from '@domain/graph/graph-status'

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-center">
      <p className="font-mono text-sm text-primary">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

/** Datos reales del indice del grafo: lo que los agentes consultan en vez de leer. */
export function GraphStatsGrid({ stats }: { stats: GraphStats }): React.JSX.Element {
  const indexado = stats.indexedAt ? stats.indexedAt.replace('T', ' ').replace('Z', '') : 's/d'

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="nodos" value={stats.nodes.toLocaleString()} />
        <Stat label="aristas" value={stats.edges.toLocaleString()} />
        <Stat label="archivos" value={stats.files.toLocaleString()} />
      </div>
      <p className="text-[11px] text-muted-foreground">Indexado: {indexado}</p>
    </div>
  )
}
