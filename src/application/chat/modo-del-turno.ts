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
 * El modo con el que corre el turno y su aviso. Degrada a supervisado por las
 * tres razones estructurales: repo propio, falta de confianza, o falta de red de
 * reversion.
 *
 * Ya NO mira el texto de la peticion (ADR-089). Antes se le pasaba el prompt mas
 * el hallazgo para que el freno de palabras los juzgara; retirado el freno, ese
 * texto no lo lee nadie, y por eso el foco tampoco entra ya por aqui.
 */
export function modoDelTurno(
  project: Project,
  input: SendMessageInput,
  selfRepo: boolean,
  redGit: boolean
): ModoDelTurno {
  return {
    mode: effectiveMode({ mode: input.mode, selfRepo, project, redGit }),
    aviso: avisoDeDegradacion(input.mode, selfRepo, redGit)
  }
}
