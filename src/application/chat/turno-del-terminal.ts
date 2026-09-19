import type { HallazgoAResolver } from '@domain/chat/hallazgo-a-resolver'
import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import { hastaConverger, type Convergencia, type Reintento } from './ciclo-de-convergencia'
import { conRedDeReversion } from './con-red-de-reversion'
import { SIN_CRITICO, type CriticoDelTurno } from './critico-del-turno'
import { juezConOmega } from './juez-del-turno'
import type { OmegaDelTurno } from './omega-del-turno'
import type { ReplyOutcome } from './reply-outcome'
import type { SendMessageInput } from './send-message-types'
import { tribunalConCritico } from './tribunal-con-critico'

export interface TurnoDeps {
  readonly context: AppContext
  readonly project: Project
  readonly red: RedDeReversion
  readonly activa: boolean
  readonly foco: HallazgoAResolver | null
  readonly input: SendMessageInput
  readonly omega: OmegaDelTurno
  /** El tribunal de la Fase B. Ausente = solo OMEGA, como en la Fase A. */
  readonly critico?: CriticoDelTurno
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

  const comun = { context, projectId: project.id, cwd: project.path }
  const juez = juezConOmega({ ...comun, omega: deps.omega })
  // Sin critico inyectado no hay tribunal, y `arbitrar` se salta el debate: la
  // Fase A entera sigue funcionando igual que antes de existir esta pieza.
  const critico = deps.critico ?? SIN_CRITICO
  const tribunal = tribunalConCritico({ ...comun, critico })
  return hastaConverger({ red, cwd: project.path, foco, pedido: input.prompt, juez, tribunal, producir }) // prettier-ignore
}
