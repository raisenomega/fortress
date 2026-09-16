import type { SendMessageInput } from '@application/chat/send-message-types'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'

/**
 * El turno de PLAN del lote (ADR-088, arco 1): si hay un lote esperando
 * aprobacion en ESTE proyecto y el mensaje no lleva ni foco ni lote propio,
 * viaja con sus ids, y asi lo contesta el productor viendo los N en vez del
 * historial del escaneo.
 *
 * Va aqui y no en la puerta del envio a proposito: el flujo de aprobacion
 * —`ejecutar`, el pendiente, la plan-card— no se toca. Esto solo anade un campo
 * a la peticion, y el foco sigue viajando como siempre.
 *
 * LIMITE conocido: mientras el lote espera aprobacion, cualquier mensaje libre
 * de ese proyecto viaja tambien con la lista. Es visible —la barra dice «Aprobar
 * plan y resolver (N)»— y se va al aprobar o al limpiar.
 */
export function conLoteDelPlan(input: SendMessageInput): SendMessageInput {
  if (input.findingId !== undefined || input.lote !== undefined) return input
  const pendiente = useColaDelLoteStore.getState().pendiente
  if (pendiente === null || pendiente.projectId !== input.projectId) return input
  return { ...input, lote: pendiente.ids }
}
