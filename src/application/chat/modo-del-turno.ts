import { textoParaElModo, type HallazgoAResolver } from '@domain/chat/hallazgo-a-resolver'
import type { Project } from '@domain/project/project'
import { effectiveMode } from '@domain/settings/modo-efectivo'
import { avisoDeDegradacion, type OperationMode } from '@domain/settings/operation-mode'
import type { SendMessageInput } from './send-message-types'

export interface ModoDelTurno {
  readonly mode: OperationMode
  /** Por que no se tuvo el modo pedido, o vacio. */
  readonly aviso: string
}

/**
 * El modo con el que corre el turno y su aviso. Degrada a supervisado si toca un
 * area protegida o si el objetivo es el repo propio (y, dentro de la regla, si
 * falta confianza o red de reversion).
 *
 * Con foco, lo que se juzga es el prompt MAS el hallazgo (ADR-088, pieza 2): un
 * «resuelvelo» neutro no puede esconder un hallazgo de auth. La regla que decide
 * (`modo-efectivo`, innegociable) no se toca: solo cambia el texto que se le da.
 */
export function modoDelTurno(
  project: Project,
  input: SendMessageInput,
  foco: HallazgoAResolver | null,
  selfRepo: boolean,
  redGit: boolean
): ModoDelTurno {
  const request = textoParaElModo(input.prompt, foco)
  return {
    mode: effectiveMode({ mode: input.mode, request, selfRepo, project, redGit }),
    aviso: avisoDeDegradacion(input.mode, selfRepo, redGit)
  }
}
