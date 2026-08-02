import { findAgent } from '@domain/agent/agent-catalog'
import type { AgentRanking } from '@domain/telemetry/agent-run'
import { Icon } from '../common/Icon'

interface AgentRankingListProps {
  readonly ranking: readonly AgentRanking[]
}

export function AgentRankingList({ ranking }: AgentRankingListProps): React.JSX.Element {
  if (ranking.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Ningun agente ha corrido en este periodo.</p>
    )
  }

  return (
    <ol className="space-y-1.5">
      {ranking.map((row, index) => {
        const agent = findAgent(row.agentId)
        return (
          <li key={row.agentId} className="flex items-center gap-2 text-xs">
            <span className="w-4 font-mono text-muted-foreground">{index + 1}</span>
            {agent ? <Icon name={agent.iconName} size={13} className="text-primary" /> : null}
            <span className="min-w-0 flex-1 truncate text-foreground">
              {agent?.name ?? row.agentId}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {row.runs} ejec · {row.edits} fixes
            </span>
          </li>
        )
      })}
    </ol>
  )
}
