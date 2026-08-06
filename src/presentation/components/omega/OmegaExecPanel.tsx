import type { AgentRun } from '@domain/telemetry/agent-run'
import { OmegaFieldGrid, type Field } from './OmegaFieldGrid'

interface OmegaExecPanelProps {
  readonly run: AgentRun
  readonly onClose: () => void
}

/** Severidad de la ejecucion por su desenlace: un fallo pesa; un ok, no. */
function severity(run: AgentRun): { readonly label: string; readonly tone: string } {
  if (run.failed) return { label: 'high', tone: 'text-critical' }
  if (run.usage.numTurns >= 40) return { label: 'medio', tone: 'text-medium' }
  return { label: 'low', tone: 'text-success' }
}

/** Barra lateral de una ejecucion (spec): nombre, badge, grid, acciones al pie. */
export function OmegaExecPanel({ run, onClose }: OmegaExecPanelProps): React.JSX.Element {
  const sev = severity(run)
  const fields: readonly Field[] = [
    { label: 'Tokens salida', value: String(run.usage.outputTokens) },
    { label: 'Turnos', value: String(run.usage.numTurns) },
    { label: 'Duracion', value: `${Math.round(run.durationMs / 1000)}s` },
    { label: 'Coste', value: `${run.usage.costUsd.toFixed(4)} usd` },
    { label: 'Herramientas', value: String(run.tools.length) },
    { label: 'Proyecto', value: run.projectId.slice(0, 8) }
  ]

  return (
    <aside className="fixed top-12 right-0 bottom-7 z-30 w-80 space-y-3 overflow-y-auto border-l border-border bg-sidebar p-4 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{run.kind}</span>
        <span
          className={`rounded-full border border-current px-1.5 text-[10px] uppercase ${sev.tone}`}
        >
          {sev.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="tap ml-auto text-xs text-muted-foreground"
        >
          Cerrar
        </button>
      </div>
      <p className="font-mono text-[11px] text-muted-foreground">
        {run.at.slice(0, 19).replace('T', ' ')}
      </p>
      <OmegaFieldGrid fields={fields} />
      <div className="flex gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onClose}
          className="tap rounded border border-border px-2 py-1 text-xs text-muted-foreground"
        >
          Cerrar
        </button>
      </div>
    </aside>
  )
}
