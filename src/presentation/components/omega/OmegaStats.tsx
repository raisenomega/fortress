import type { AgentHealth } from '@domain/omega/agent-health'
import { globalStats } from '@domain/omega/global-stats'

interface OmegaStatsProps {
  readonly agents: readonly AgentHealth[]
}

const line = (a: AgentHealth): string => `${a.name} (${a.compliance}%)`

/** Estadisticas globales del sistema (spec §7), todo sumado de datos reales. */
export function OmegaStats({ agents }: OmegaStatsProps): React.JSX.Element {
  const s = globalStats(agents)
  const totales: ReadonlyArray<readonly [string, string]> = [
    ['Ejecuciones', String(s.totalRuns)],
    ['Fallidas', String(s.failedRuns)],
    ['Tokens salida', String(s.totalTokens)]
  ]

  return (
    <div className="space-y-3 rounded-md border border-border bg-card p-3 text-xs">
      <dl className="grid grid-cols-3 gap-2">
        {totales.map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] tracking-widest text-success uppercase">Mejores</p>
          {s.top.length === 0 ? <p className="text-muted-foreground">s/d</p> : null}
          {s.top.map((a) => (
            <p key={a.agentId} className="text-foreground">{line(a)}</p>
          ))}
        </div>
        <div>
          <p className="text-[10px] tracking-widest text-critical uppercase">Peores</p>
          {s.bottom.length === 0 ? <p className="text-muted-foreground">s/d</p> : null}
          {s.bottom.map((a) => (
            <p key={a.agentId} className="text-foreground">{line(a)}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
