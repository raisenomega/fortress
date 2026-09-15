import type { Agent } from '@domain/agent/agent'
import { Icon } from '../common/Icon'

interface AgentFixedRowProps {
  readonly agent: Agent
  readonly onOpen: (id: Agent['id']) => void
}

/**
 * Un agente que el operador NO puede dejar fuera: se ve y se abre como los
 * demas, pero en lugar del interruptor dice que es fijo. Hoy solo el productor
 * del Terminal (ADR-088, Enmienda 2), sin el cual resolver no tendria quien
 * produjera.
 */
export function AgentFixedRow({ agent, onOpen }: AgentFixedRowProps): React.JSX.Element {
  return (
    <div
      title={agent.purpose}
      className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-secondary"
    >
      <Icon name={agent.iconName} size={15} className="text-primary" />
      <button
        type="button"
        onClick={() => onOpen(agent.id)}
        title={`Ver que ha hecho ${agent.name} en este proyecto`}
        className="tap min-w-0 flex-1 truncate text-left text-sm text-foreground hover:text-primary"
      >
        {agent.name}
      </button>
      <span
        title="Siempre activo: resuelve los hallazgos que se mandan al Terminal"
        className="text-[10px] tracking-wide text-muted-foreground uppercase"
      >
        fijo
      </span>
    </div>
  )
}
