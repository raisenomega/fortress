import type { AgentRun } from '@domain/telemetry/agent-run'
import { OmegaHistoryRow } from './OmegaHistoryRow'

interface OmegaAgentHistoryProps {
  readonly runs: readonly AgentRun[]
}

/** Historial REAL de ejecuciones como tabla; cada fila expande su detalle (spec §3). */
export function OmegaAgentHistory({ runs }: OmegaAgentHistoryProps): React.JSX.Element {
  if (runs.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin ejecuciones registradas de este agente.</p>
  }

  const head = ['Fecha', 'Tipo', 'Tokens', 'Estado']
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border text-muted-foreground">
          {head.map((h, i) => (
            <th key={h} className={`px-2 py-1 font-medium ${i < 2 ? 'text-left' : 'text-right'}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => (
          <OmegaHistoryRow key={run.id} run={run} />
        ))}
      </tbody>
    </table>
  )
}
