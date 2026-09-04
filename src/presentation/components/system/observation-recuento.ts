import { OBSERVATION_STATUSES, type SelfObservation } from '@domain/system/self-observation'

export interface Recuento {
  readonly status: (typeof OBSERVATION_STATUSES)[number]
  readonly n: number
}

/**
 * Cuantas hay de cada estado, para la cabecera. Existe porque la lista va en
 * orden de observacion y no por estado: sin este resumen, saber cuantas quedan
 * abiertas obligaria a recorrer treinta y cuatro paginas contando puntos.
 *
 * Recorre el vocabulario, no los datos, asi que un estado con cero sale como
 * cero en vez de desaparecer — que hoy no haya descartes no es lo mismo que no
 * poder haberlos.
 */
export function recuento(observations: readonly SelfObservation[]): readonly Recuento[] {
  return OBSERVATION_STATUSES.map((status) => ({
    status,
    n: observations.filter((o) => o.status === status).length
  }))
}
