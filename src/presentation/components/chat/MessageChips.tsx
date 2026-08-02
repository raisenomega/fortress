import { findAgent } from '@domain/agent/agent-catalog'
import type { ChatMessage } from '@domain/chat/chat-message'
import type { IconName } from '@domain/shared/icon-name'
import { useProjectStore } from '../../stores/project-store'
import { Chip } from '../common/Chip'

const MODE_ICON: Record<ChatMessage['mode'], IconName> = {
  supervisado: 'eye',
  autonomo: 'zap'
}

const ENGINE: Record<ChatMessage['engine'], { icon: IconName; label: string; hint: string }> = {
  'claude-code': {
    icon: 'terminal',
    label: 'Claude Code',
    hint: 'Ejecutado dentro del proyecto, con acceso a archivos, bash y git'
  },
  api: {
    icon: 'message-square',
    label: 'solo texto',
    hint: 'Respondio la API sin acceso al proyecto: no leyo ni modifico archivos'
  }
}

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
        <Chip tone="agent" iconName={agent.iconName} label={agent.name} title={agent.purpose} />
      ) : null}

      {project ? (
        <Chip tone="project" iconName="folder-open" label={project.name} title={project.path} />
      ) : null}

      <Chip
        tone="mode"
        iconName={MODE_ICON[message.mode]}
        label={message.mode}
        title={`Generado en modo ${message.mode}`}
      />

      {message.role === 'assistant' ? (
        <Chip
          tone="mode"
          iconName={ENGINE[message.engine].icon}
          label={ENGINE[message.engine].label}
          title={ENGINE[message.engine].hint}
        />
      ) : null}
    </div>
  )
}
