import { findAgent } from '@domain/agent/agent-catalog'
import type { IconName } from '@domain/shared/icon-name'
import type { Activity, ActivityKind } from '@domain/telemetry/activity'
import { formatMoment } from '../../format/time'
import { Icon } from '../common/Icon'
import { SeverityBadge } from '../scan/SeverityBadge'

const KIND_ICON: Record<ActivityKind, IconName> = {
  scan: 'shield',
  chat: 'message-square',
  finding: 'alert-triangle',
  edit: 'wrench',
  push: 'git-branch',
  dismiss: 'eye'
}

interface TimelineEntryProps {
  readonly entry: Activity
}

export function TimelineEntry({ entry }: TimelineEntryProps): React.JSX.Element {
  const agent = entry.agentId ? findAgent(entry.agentId) : undefined

  return (
    <li className="flex items-start gap-3 border-b border-border/50 py-2 last:border-0">
      <span className="w-28 shrink-0 font-mono text-[10px] text-muted-foreground">
        {formatMoment(entry.at)}
      </span>
      <Icon name={KIND_ICON[entry.kind]} size={13} className="mt-0.5 shrink-0 text-primary" />
      {agent ? (
        <span className="w-32 shrink-0 truncate text-[11px] text-muted-foreground">
          {agent.name}
        </span>
      ) : null}
      {entry.severity ? <SeverityBadge severity={entry.severity} /> : null}
      <span className="min-w-0 flex-1 text-xs text-foreground">
        {entry.summary}
        {entry.file ? (
          <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
            {entry.file}
            {entry.line === null ? '' : `:${entry.line}`}
          </span>
        ) : null}
      </span>
    </li>
  )
}
