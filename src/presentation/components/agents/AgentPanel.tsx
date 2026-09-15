import { AGENT_CATALOG, esInterruptor } from '@domain/agent/agent-catalog'
import { useAgentStore } from '../../stores/agent-store'
import { useUiStore } from '../../stores/ui-store'
import { AgentFixedRow } from './AgentFixedRow'
import { AgentToggleRow } from './AgentToggleRow'

export function AgentPanel(): React.JSX.Element {
  const excluded = useAgentStore((state) => state.excluded)
  const toggle = useAgentStore((state) => state.toggle)
  const setOpenAgent = useUiStore((state) => state.setOpenAgent)

  // Interruptor solo para quien el operador puede dejar fuera; el resto, fijo.
  return (
    <div className="flex flex-col gap-0.5">
      {AGENT_CATALOG.map((agent) =>
        esInterruptor(agent) ? (
          <AgentToggleRow
            key={agent.id}
            agent={agent}
            enabled={!excluded.includes(agent.id)}
            onToggle={toggle}
            onOpen={setOpenAgent}
          />
        ) : (
          <AgentFixedRow key={agent.id} agent={agent} onOpen={setOpenAgent} />
        )
      )}
    </div>
  )
}
