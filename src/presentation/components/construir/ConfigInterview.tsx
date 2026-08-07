import { sendMessage, stopWorkflow } from '../../services/chat-service'
import { useProjectMessages, useProjectStreaming } from '../../stores/chat-selectors'
import { ChatInput } from '../chat/ChatInput'
import { ChatMessageList } from '../chat/ChatMessageList'
import { ConfigurationCard } from '../config/ConfigurationCard'

interface ConfigInterviewProps {
  readonly projectId: string
}

/**
 * La entrevista de configuracion vive en el "Chat": aqui se habla con Claude
 * sobre la documentacion del proyecto nuevo y se aprueban los docs. Al ejecutar,
 * el proyecto pasa a CONFIGURADO y el trabajo real ocurre en el Terminal.
 */
export function ConfigInterview({ projectId }: ConfigInterviewProps): React.JSX.Element {
  const messages = useProjectMessages(projectId)
  const streaming = useProjectStreaming(projectId)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ConfigurationCard projectId={projectId} />
      <div className="min-h-0 flex-1">
        <ChatMessageList messages={messages} transfer />
      </div>
      <ChatInput
        disabled={streaming}
        running={streaming}
        onStop={() => void stopWorkflow(projectId)}
        onSend={(prompt) =>
          void sendMessage({ projectId, prompt, mode: 'supervisado', excludedAgents: [] })
        }
        configuring
      />
    </div>
  )
}
