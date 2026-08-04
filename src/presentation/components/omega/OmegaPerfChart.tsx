import type { AgentRun } from '@domain/telemetry/agent-run'

interface OmegaPerfChartProps {
  readonly runs: readonly AgentRun[]
}

/**
 * Grafica de rendimiento (spec §3) con datos REALES: una barra por ejecucion,
 * verde si fue bien, roja si fallo, alto segun tokens. Hover = fecha + tokens.
 */
export function OmegaPerfChart({ runs }: OmegaPerfChartProps): React.JSX.Element {
  if (runs.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin ejecuciones para graficar.</p>
  }

  const max = Math.max(...runs.map((r) => r.usage.outputTokens), 1)
  const cronologico = [...runs].reverse()

  return (
    <div className="flex h-24 items-end gap-1 overflow-x-auto rounded-md border border-border bg-card p-2">
      {cronologico.map((run) => (
        <div
          key={run.id}
          title={`${run.at.slice(0, 16).replace('T', ' ')} · ${run.usage.outputTokens} tok`}
          className={`w-2 shrink-0 rounded-t ${run.failed ? 'bg-critical' : 'bg-success'}`}
          style={{ height: `${Math.max(6, Math.round((100 * run.usage.outputTokens) / max))}%` }}
        />
      ))}
    </div>
  )
}
