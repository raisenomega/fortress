import type { AgentHealth } from '@domain/omega/agent-health'
import { OmegaAgentRow } from './OmegaAgentRow'

interface OmegaAgentsTableProps {
  readonly agents: readonly AgentHealth[]
  readonly selected: string | null
  readonly onSelect: (agentId: string) => void
}

const HEAD = ['Agente', 'Ejec.', 'Fallos', 'Cumpl.', 'Tokens']

/** Vista macro: los agentes del sistema con su salud real. */
export function OmegaAgentsTable({
  agents,
  selected,
  onSelect
}: OmegaAgentsTableProps): React.JSX.Element {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-secondary/40 text-muted-foreground">
            {HEAD.map((h, i) => (
              <th key={h} className={`px-2 py-1 font-medium ${i === 0 ? 'text-left' : 'text-right'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <OmegaAgentRow
              key={agent.agentId}
              agent={agent}
              selected={selected === agent.agentId}
              onSelect={() => onSelect(agent.agentId)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
