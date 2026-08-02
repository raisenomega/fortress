import type { Agent } from '@domain/agent/agent'
import { Icon } from '../common/Icon'
import { Toggle } from '../common/Toggle'

interface AgentToggleRowProps {
  readonly agent: Agent
  readonly enabled: boolean
  readonly onToggle: (id: Agent['id']) => void
  readonly onOpen: (id: Agent['id']) => void
}

export function AgentToggleRow({
  agent,
  enabled,
  onToggle,
  onOpen
}: AgentToggleRowProps): React.JSX.Element {
  return (
    <div
      title={agent.purpose}
      className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-secondary"
    >
      <Icon
        name={agent.iconName}
        size={15}
        className={enabled ? 'text-primary' : 'text-muted-foreground'}
      />
      <button
        type="button"
        onClick={() => onOpen(agent.id)}
        title={`Ver que ha hecho ${agent.name} en este proyecto`}
        className={`tap min-w-0 flex-1 truncate text-left text-sm hover:text-primary ${
          enabled ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {agent.name}
      </button>
      <Toggle
        checked={enabled}
        onChange={() => onToggle(agent.id)}
        label={`${enabled ? 'Excluir' : 'Incluir'} ${agent.name} de los workflows`}
      />
    </div>
  )
}
