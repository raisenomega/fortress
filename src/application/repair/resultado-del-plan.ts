import type { Proposal } from '@domain/repair/proposal'
import { NO_ES_SU_VEHICULO } from '@domain/repair/vehiculo-del-motor'

/**
 * Como acaba un intento de PLANIFICAR una reparacion.
 *
 * Nace de una asimetria medida entre los DOS nacimientos: `retryRepair` ya
 * devolvia su motivo (`{ ok: false, reason }`) y `planRepair` devolvia `null` a
 * secas, con lo que sus CUATRO finales sin propuesta se contaban como uno. Un
 * proyecto de cliente negado por el perimetro (ADR-107) le llegaba al operador
 * como «no queda nada elegible»: una frase falsa sobre un bloqueo deliberado.
 *
 * El motivo viaja TIPADO hasta el parte del drenaje y hasta el aviso de la UI.
 * NO se escribe en ningun libro, y es a proposito: no hay propuesta a la que
 * colgar un evento, y asentarlo como observacion llevaria el nombre del
 * proyecto del CLIENTE al export de auto-mejora, contra el cerco de ADR-085.
 */
export type PlanNegado =
  typeof NO_ES_SU_VEHICULO | 'proyecto-desconocido' | 'sin-head-de-git' | 'sin-candidato'

export type PlanResult =
  | { readonly ok: true; readonly proposal: Proposal }
  | { readonly ok: false; readonly reason: PlanNegado }

export const negado = (reason: PlanNegado): PlanResult => ({ ok: false, reason })
export const planificada = (proposal: Proposal): PlanResult => ({ ok: true, proposal })
