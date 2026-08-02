import type { StepProgress } from '../workflow/step-progress'
import type { Assistant } from '@domain/chat/assistant'
import type { CodeAgent } from '@domain/chat/code-agent'
import { effectiveMode } from '@domain/settings/operation-mode'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { recordChatRun } from '../telemetry/record-chat-run'
import { appendMessage } from './chat-history'
import { chooseEngine } from './choose-engine'
import { produceReply } from './produce-reply'
import type { SendMessageInput, SendMessageOutput } from './send-message-types'

export async function sendMessage(
  context: AppContext,
  assistant: Assistant | null,
  codeAgent: CodeAgent,
  input: SendMessageInput,
  onChunk: (delta: string) => void,
  onStep: (progress: StepProgress) => void,
  isCancelled: () => boolean
): Promise<Result<SendMessageOutput>> {
  const project = context.projects.findById(input.projectId)
  if (!project) return err('El proyecto ya no existe')

  // El modo degrada a supervisado si la peticion toca un area protegida.
  const mode = effectiveMode(input.mode, input.prompt)

  const chosen = chooseEngine(codeAgent, assistant, project)
  if (!chosen.ok) return err(chosen.error)
  const engine = chosen.value

  const persist = (
    role: 'user' | 'assistant',
    content: string,
    agentId: SendMessageOutput['assistant']['agentId']
  ): ReturnType<typeof appendMessage> =>
    appendMessage(context, { projectId: project.id, role, content, agentId, mode, engine })

  const user = persist('user', input.prompt, null)
  if (!user.ok) return err(user.error)

  const startedAt = Date.now()
  const outcome = await produceReply({
    ...{ context, assistant, codeAgent, project, input, mode, engine },
    excludedAgents: input.excludedAgents,
    onStep,
    isCancelled,
    onChunk
  })

  // El chip del mensaje es el primer agente que participo de verdad.
  const agentId = outcome.agents[0] ?? null
  const stored = persist('assistant', outcome.text, agentId)
  if (!stored.ok) return err(stored.error)

  recordChatRun(context, { project, agentId, engine, outcome, startedAt, prompt: input.prompt })
  return ok({ user: user.value, assistant: stored.value, engine })
}
