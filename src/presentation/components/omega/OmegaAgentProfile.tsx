import type { AgentHealth } from '@domain/omega/agent-health'
import { compliancePercentile } from '@domain/omega/agent-percentile'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import type { AgentRun } from '@domain/telemetry/agent-run'
import { OmegaAgentDiscrepancies } from './OmegaAgentDiscrepancies'
import { OmegaAgentHistory } from './OmegaAgentHistory'

interface OmegaAgentProfileProps {
  readonly agentId: string
  readonly agents: readonly AgentHealth[]
  readonly runs: readonly AgentRun[]
  readonly log: readonly OmegaEntry[]
}

const band = (c: number | null): string =>
  c === null ? 'sin datos' : c >= 75 ? 'confiable' : c >= 50 ? 'cuestionable' : 'no confiable'

/** Perfil micro (spec §3): cabecera + metricas reales + historial + discrepancias. */
export function OmegaAgentProfile(props: OmegaAgentProfileProps): React.JSX.Element | null {
  const { agentId, agents, runs, log } = props
  const agent = agents.find((a) => a.agentId === agentId)
  if (!agent) return null

  const pct = compliancePercentile(agents, agentId)
  const metrics: ReadonlyArray<readonly [string, string]> = [
    ['Confiabilidad', agent.compliance === null ? 's/d' : `${agent.compliance}%`],
    ['Percentil (sistema)', pct === null ? 's/d' : `${pct}%`],
    ['Discrepancias', String(agent.discrepancies)]
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Estado: <span className="text-foreground">{band(agent.compliance)}</span> · Modelo: sesion
        de Claude Code · {agent.runs} ejecuciones
      </p>
      <dl className="grid grid-cols-3 gap-2 text-xs">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-1">
        <h4 className="text-[10px] tracking-widest text-muted-foreground uppercase">Historial</h4>
        <OmegaAgentHistory runs={runs.filter((r) => r.agentId === agentId)} />
      </div>
      <div className="space-y-1">
        <h4 className="text-[10px] tracking-widest text-muted-foreground uppercase">Discrepancias</h4>
        <OmegaAgentDiscrepancies entries={log.filter((e) => e.agentId === agentId)} />
      </div>
    </div>
  )
}
