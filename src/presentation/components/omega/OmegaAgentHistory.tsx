import type { AgentRun } from '@domain/telemetry/agent-run'

interface OmegaAgentHistoryProps {
  readonly runs: readonly AgentRun[]
}

/** Historial REAL de ejecuciones del agente (spec §3). */
export function OmegaAgentHistory({ runs }: OmegaAgentHistoryProps): React.JSX.Element {
  if (runs.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin ejecuciones registradas de este agente.</p>
  }

  return (
    <ul className="space-y-1">
      {runs.map((run) => (
        <li
          key={run.id}
          className="flex items-center gap-2 rounded border border-border px-2 py-1 text-xs"
        >
          <span className={run.failed ? 'text-critical' : 'text-success'}>
            {run.failed ? 'fallo' : 'ok'}
          </span>
          <span className="text-muted-foreground">{run.kind}</span>
          <span className="text-muted-foreground">{run.usage.outputTokens} tok</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            {run.at.slice(0, 16).replace('T', ' ')}
          </span>
        </li>
      ))}
    </ul>
  )
}
