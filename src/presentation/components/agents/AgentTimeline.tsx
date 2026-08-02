import type { Activity } from '@domain/telemetry/activity'
import { formatMoment } from '../../format/time'
import { SeverityBadge } from '../scan/SeverityBadge'

interface AgentTimelineProps {
  readonly entries: readonly Activity[]
}

export function AgentTimeline({ entries }: AgentTimelineProps): React.JSX.Element {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Este agente todavia no ha intervenido en este proyecto.
      </p>
    )
  }

  return (
    <ul className="max-h-56 space-y-1.5 overflow-y-auto">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-start gap-2 text-xs">
          <span className="w-24 shrink-0 font-mono text-[10px] text-muted-foreground">
            {formatMoment(entry.at)}
          </span>
          {entry.severity ? <SeverityBadge severity={entry.severity} /> : null}
          <span className="min-w-0 flex-1 text-foreground">
            {entry.summary}
            {entry.file ? (
              <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                {entry.file}
                {entry.line === null ? '' : `:${entry.line}`}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  )
}
