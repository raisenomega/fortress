import type { StepProgress } from '../workflow/step-progress'
import type { Assistant } from '@domain/chat/assistant'
import type { CodeAgent } from '@domain/chat/code-agent'
import { SIN_RED, type RedDeReversion } from '@domain/chat/red-de-reversion'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { chooseEngine } from './choose-engine'
import { agentesDelTurno } from '@domain/chat/agentes-del-turno'
import { SIN_CRITICO, type CriticoDelTurno } from './critico-del-turno'
import { SIN_OMEGA, type OmegaDelTurno } from './omega-del-turno'
import { seConservoSinCompilar } from './turno-protegido'
import { turnoDelTerminal } from './turno-del-terminal'
import { productorDelTurno } from './productor-del-turno'
import { sinSecretosEnVivo } from './en-vivo-tachado'
import { finishTurn } from './finish-turn'
import { leerFoco } from './foco-del-turno'
import { modoDelTurno } from './modo-del-turno'
import { persistTurn } from './persist-message'
import { runConfigurationTurn } from './run-configuration-turn'
import { trasElTurno } from './tras-el-turno'
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
  red: RedDeReversion = SIN_RED,
  omega: OmegaDelTurno = SIN_OMEGA,
  critico: CriticoDelTurno = SIN_CRITICO
): Promise<Result<SendMessageOutput>> {
  const project = context.projects.findById(input.projectId)
  if (!project) return err('El proyecto ya no existe')
  const enVivo = sinSecretosEnVivo(onChunk)
  // Bloqueo autoritativo (vale en autonomo): sin marco aprobado, solo la entrevista.
  if (project.configState === 'PENDIENTE_CONFIGURACION') {
    return runConfigurationTurn(context, codeAgent, project, input, enVivo)
  }
  const foco = leerFoco(context, project.id, input.findingId)
  if (!foco.ok) return err(foco.error)
  const redGit = red.disponible(project.path)
  const { mode, aviso } = modoDelTurno(project, input, isSelfRepo(project.path), redGit)

  const chosen = chooseEngine(codeAgent, assistant, project)
  if (!chosen.ok) return err(chosen.error)
  const engine = chosen.value
  const meta = { mode, engine }

  const user = persistTurn(context, project.id, meta, 'user', input.prompt, null)
  if (!user.ok) return err(user.error)

  const startedAt = Date.now()
  const activa = mode === 'autonomo' && engine === 'claude-code'
  const producir = productorDelTurno({
    ...{ context, assistant, codeAgent, project, input, mode, engine, onStep, isCancelled },
    foco: foco.value,
    agentes: agentesDelTurno(activa && foco.value !== null && redGit, critico !== SIN_CRITICO),
    onChunk: enVivo
  })
  const ciclo = await turnoDelTerminal({ context, project, red, activa, foco: foco.value, input, producir, omega, critico, avisar: onStep }) // prettier-ignore
  const stored = finishTurn({ context, project, meta, outcome: ciclo.turno.outcome, aviso: aviso + ciclo.turno.aviso, startedAt, prompt: input.prompt }) // prettier-ignore
  if (!stored.ok) return err(stored.error)
  // Tras guardar la respuesta: la memoria y el cierre del hallazgo (ADR-088).
  const sinCierre = await trasElTurno(context, foco.value?.id ?? null, ciclo.turno, stored.value, ciclo)
  const sinVerificar = seConservoSinCompilar(ciclo.turno)
  return ok({ user: user.value, assistant: stored.value, engine, sinCierre, sinVerificar }) // prettier-ignore
}
