import type { StepProgress } from '../workflow/step-progress'
import type { Assistant } from '@domain/chat/assistant'
import type { CodeAgent } from '@domain/chat/code-agent'
import { effectiveMode } from '@domain/settings/operation-mode'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { recordChatRun } from '../telemetry/record-chat-run'
import { persistQuality } from '../scan/persist-quality'
import { chooseEngine } from './choose-engine'
import { persistTurn } from './persist-message'
import { produceReply } from './produce-reply'
import { runConfigurationTurn } from './run-configuration-turn'
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

  // Bloqueo autoritativo (vale en autonomo): un proyecto sin marco aprobado solo
  // hace la entrevista de configuracion, nunca trabajo normal.
  if (project.configState === 'PENDIENTE_CONFIGURACION') {
    return runConfigurationTurn(context, codeAgent, project, input, onChunk)
  }

  // El modo degrada a supervisado si la peticion toca un area protegida.
  const mode = effectiveMode(input.mode, input.prompt)

  const chosen = chooseEngine(codeAgent, assistant, project)
  if (!chosen.ok) return err(chosen.error)
  const engine = chosen.value
  const meta = { mode, engine }

  const user = persistTurn(context, project.id, meta, 'user', input.prompt, null)
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
  const stored = persistTurn(context, project.id, meta, 'assistant', outcome.text, agentId)
  if (!stored.ok) return err(stored.error)

  recordChatRun(context, { project, agentId, engine, outcome, startedAt, prompt: input.prompt })
  // Auditoria integral -> fija la CALIDAD GENERAL del proyecto (la tarjeta la muestra).
  if (outcome.comprehensive) persistQuality(context, project, outcome.findings)

  return ok({ user: user.value, assistant: stored.value, engine })
}
