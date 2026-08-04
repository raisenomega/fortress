import type { AgentRun } from '@domain/telemetry/agent-run'

interface OmegaAgentProfileProps {
  readonly agentId: string
  readonly runs: readonly AgentRun[]
}

/** Perfil micro: las ejecuciones REALES recientes del agente seleccionado. */
export function OmegaAgentProfile({ agentId, runs }: OmegaAgentProfileProps): React.JSX.Element {
  const propias = runs.filter((run) => run.agentId === agentId)

  if (propias.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Sin ejecuciones registradas de este agente en el proyecto.
      </p>
    )
  }

  return (
    <ul className="space-y-1">
      {propias.map((run) => (
        <li key={run.id} className="flex items-center gap-2 rounded border border-border px-2 py-1 text-xs">
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
