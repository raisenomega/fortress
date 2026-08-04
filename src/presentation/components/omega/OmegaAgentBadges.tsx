import type { AgentHealth } from '@domain/omega/agent-health'

interface OmegaAgentBadgesProps {
  readonly agents: readonly AgentHealth[]
  readonly onSelect: (agentId: string) => void
}

const dot = (a: AgentHealth): string =>
  a.discrepancies > 0 ? 'bg-critical' : a.runs === 0 ? 'bg-muted-foreground' : 'bg-success'

/** Agentes como badges de una linea (spec): nombre + estado. Click abre su pagina. */
export function OmegaAgentBadges({ agents, onSelect }: OmegaAgentBadgesProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {agents.map((agent) => (
        <button
          key={agent.agentId}
          type="button"
          data-omega-agent={agent.agentId}
          onClick={() => onSelect(agent.agentId)}
          className="tap flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-foreground hover:border-primary/50"
        >
          <span className={`h-2 w-2 rounded-full ${dot(agent)}`} />
          {agent.name}
        </button>
      ))}
    </div>
  )
}
