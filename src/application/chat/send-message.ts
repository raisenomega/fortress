import type { StepProgress } from '../workflow/step-progress'
import type { Assistant } from '@domain/chat/assistant'
import type { CodeAgent } from '@domain/chat/code-agent'
import { SIN_RED, type RedDeReversion } from '@domain/chat/red-de-reversion'
import { avisoDeDegradacion } from '@domain/settings/operation-mode'
import { effectiveMode } from '@domain/settings/modo-efectivo'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { chooseEngine } from './choose-engine'
import { conRedDeReversion } from './con-red-de-reversion'
import { sinSecretosEnVivo } from './en-vivo-tachado'
import { finishTurn } from './finish-turn'
import { persistTurn } from './persist-message'
import { produceReply } from './produce-reply'
import type { ReplyOutcome } from './reply-outcome'
import { runConfigurationTurn } from './run-configuration-turn'
import type { SendMessageInput, SendMessageOutput } from './send-message-types'

export async function sendMessage(
  context: AppContext,
  assistant: Assistant | null,
  codeAgent: CodeAgent,
  input: SendMessageInput,
  onChunk: (delta: string) => void,
  onStep: (progress: StepProgress) => void,
  isCancelled: () => boolean,
  /** Lo inyecta la infra (leer package.json del disco es su terreno). */
  isSelfRepo: (path: string) => boolean = () => false,
  /** La red del ADR-079; tambien de la infra (es git). Sin ella no hay checkpoint. */
  red: RedDeReversion = SIN_RED
): Promise<Result<SendMessageOutput>> {
  const project = context.projects.findById(input.projectId)
  if (!project) return err('El proyecto ya no existe')
  const enVivo = sinSecretosEnVivo(onChunk)
  // Bloqueo autoritativo (vale en autonomo): sin marco aprobado, solo la entrevista.
  if (project.configState === 'PENDIENTE_CONFIGURACION') {
    return runConfigurationTurn(context, codeAgent, project, input, enVivo)
  }
  // Degrada a supervisado si toca un area protegida o si el objetivo es el repo propio.
  const selfRepo = isSelfRepo(project.path)
  const redGit = red.disponible(project.path)
  const mode = effectiveMode({ mode: input.mode, request: input.prompt, selfRepo, project, redGit }) // prettier-ignore
  const aviso = avisoDeDegradacion(input.mode, selfRepo, redGit)

  const chosen = chooseEngine(codeAgent, assistant, project)
  if (!chosen.ok) return err(chosen.error)
  const engine = chosen.value
  const meta = { mode, engine }

  const user = persistTurn(context, project.id, meta, 'user', input.prompt, null)
  if (!user.ok) return err(user.error)

  const startedAt = Date.now()
  const activa = mode === 'autonomo' && engine === 'claude-code'
  const producir = (): Promise<ReplyOutcome> =>
    produceReply({
      ...{ context, assistant, codeAgent, project, input, mode, engine },
      excludedAgents: input.excludedAgents,
      onStep,
      isCancelled,
      onChunk: enVivo
    })
  const turno = await conRedDeReversion(red, project.path, activa, producir)
  const stored = finishTurn({ context, project, meta, outcome: turno.outcome, aviso: aviso + turno.aviso, startedAt, prompt: input.prompt }) // prettier-ignore
  if (!stored.ok) return err(stored.error)

  return ok({ user: user.value, assistant: stored.value, engine })
}
