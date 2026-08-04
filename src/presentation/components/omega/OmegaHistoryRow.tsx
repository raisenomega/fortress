import { useState } from 'react'
import type { AgentRun } from '@domain/telemetry/agent-run'

interface OmegaHistoryRowProps {
  readonly run: AgentRun
}

/** Fila de historial que se EXPANDE al click (spec §3: profundidad progresiva). */
export function OmegaHistoryRow({ run }: OmegaHistoryRowProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const estado = run.failed ? 'fallo' : 'ok'

  return (
    <>
      <tr onClick={() => setOpen(!open)} className="tap cursor-pointer border-b border-border">
        <td className="px-2 py-1 font-mono text-[10px] text-muted-foreground">
          {run.at.slice(0, 16).replace('T', ' ')}
        </td>
        <td className="px-2 py-1 text-muted-foreground">{run.kind}</td>
        <td className="px-2 py-1 text-right text-muted-foreground">{run.usage.outputTokens}</td>
        <td className={`px-2 py-1 text-right ${run.failed ? 'text-critical' : 'text-success'}`}>
          {estado}
        </td>
      </tr>
      {open ? (
        <tr className="border-b border-border bg-secondary/20">
          <td colSpan={4} className="px-2 py-1 text-[11px] text-muted-foreground">
            {run.tools.length} herramientas · {Math.round(run.durationMs / 1000)}s ·{' '}
            {run.usage.costUsd.toFixed(4)} usd · {run.usage.numTurns} turnos
          </td>
        </tr>
      ) : null}
    </>
  )
}
