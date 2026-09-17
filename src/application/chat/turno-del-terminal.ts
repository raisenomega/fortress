import type { HallazgoAResolver } from '@domain/chat/hallazgo-a-resolver'
import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import { hastaConverger, type Convergencia, type Reintento } from './ciclo-de-convergencia'
import { conRedDeReversion } from './con-red-de-reversion'
import { juezConOmega } from './juez-del-turno'
import type { OmegaDelTurno } from './omega-del-turno'
import type { ReplyOutcome } from './reply-outcome'
import type { SendMessageInput } from './send-message-types'

export interface TurnoDeps {
  readonly context: AppContext
  readonly project: Project
  readonly red: RedDeReversion
  readonly activa: boolean
  readonly foco: HallazgoAResolver | null
  readonly input: SendMessageInput
  readonly omega: OmegaDelTurno
  readonly producir: (reintento: Reintento | null) => Promise<ReplyOutcome>
}

/**
 * El turno del Terminal, con o sin juicio (ADR-090, Fase A).
 *
 * CON juicio solo cuando se dan las tres: red activa (que es autonomo con CLI),
 * un hallazgo enfocado contra el que juzgar, y un checkpoint que sepa ensenar lo
 * editado. En supervisado NO entra: alli el auditor es el humano, y meterle un
 * veto automatico encima seria quitarle la decision que fue a tomar.
 *
 * Sin juicio se cae al turno de siempre, sin reintentos y sin veredicto.
 */
export async function turnoDelTerminal(deps: TurnoDeps): Promise<Convergencia> {
  const { context, project, red, activa, foco, input, producir } = deps
  if (!activa || foco === null) {
    const turno = await conRedDeReversion(red, project.path, activa, () => producir(null))
    return { turno, convergio: true, razon: null, intentos: 1 }
  }

  const juez = juezConOmega({
    context,
    projectId: project.id,
    cwd: project.path,
    omega: deps.omega
  })
  return hastaConverger({ red, cwd: project.path, foco, pedido: input.prompt, juez, producir })
}
