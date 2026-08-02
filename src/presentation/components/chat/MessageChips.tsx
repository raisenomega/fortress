import { findAgent } from '@domain/agent/agent-catalog'
import type { ChatMessage } from '@domain/chat/chat-message'
import { useProjectStore } from '../../stores/project-store'
import { Chip } from '../common/Chip'

const MODE_ICON = { supervisado: '👁', autonomo: '⚡' } as const

interface MessageChipsProps {
  readonly message: ChatMessage
}

/**
 * Cada mensaje declara de donde viene: que agente lo produjo, a que proyecto
 * pertenece y bajo que modo se genero. Asi un historial compartido sigue
 * siendo auditable.
 */
export function MessageChips({ message }: MessageChipsProps): React.JSX.Element {
  const project = useProjectStore((state) =>
    state.projects.find((candidate) => candidate.id === message.projectId)
  )
  const agent = message.agentId ? findAgent(message.agentId) : undefined

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      {agent ? (
        <Chip tone="agent" icon={agent.icon} label={agent.name} title={agent.purpose} />
      ) : null}

      {project ? <Chip tone="project" icon="📁" label={project.name} title={project.path} /> : null}

      <Chip
        tone="mode"
        icon={MODE_ICON[message.mode]}
        label={message.mode}
        title={`Generado en modo ${message.mode}`}
      />
    </div>
  )
}
