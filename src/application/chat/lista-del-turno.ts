import type { HallazgoAResolver } from '@domain/chat/hallazgo-a-resolver'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import { lineasDelLote } from './hallazgos-del-lote'
import { knownFindings } from './known-findings'
import type { SendMessageInput } from './send-message-types'

/**
 * La lista breve que ve el agente en este turno, y de donde sale:
 *
 * - con LOTE, los del lote —sin el del foco, que ya va entero en su bloque—;
 * - sin lote y sin foco, el historial de escaneos anteriores;
 * - con foco a secas, nada: su bloque lo dice todo.
 */
export function listaDelTurno(
  context: AppContext,
  project: Project,
  input: SendMessageInput,
  foco: HallazgoAResolver | null
): readonly string[] {
  const lote = input.lote ?? []
  if (lote.length > 0) return lineasDelLote(context, project.id, lote, foco?.id)
  return foco === null ? knownFindings(context, project) : []
}
