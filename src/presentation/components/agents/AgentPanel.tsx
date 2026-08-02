import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import { useAgentStore } from '../../stores/agent-store'
import { AgentToggleRow } from './AgentToggleRow'

export function AgentPanel(): React.JSX.Element {
  const enabled = useAgentStore((state) => state.enabled)
  const toggle = useAgentStore((state) => state.toggle)

  return (
    <div className="flex flex-col gap-0.5">
      {AGENT_CATALOG.map((agent) => (
        <AgentToggleRow
          key={agent.id}
          agent={agent}
          enabled={enabled.includes(agent.id)}
          onToggle={toggle}
        />
      ))}
    </div>
  )
}
