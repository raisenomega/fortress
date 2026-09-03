import type { ObservationKind, SelfObservation } from './self-observation'

/**
 * Urgencia por tipo, para desempatar: algo roto antes que algo que falta, y
 * algo que falta antes que una idea nueva. Menor numero, mas arriba.
 */
const URGENCIA: Readonly<Record<ObservationKind, number>> = {
  bug: 0,
  gap: 1,
  limitacion: 2,
  falta: 3,
  oportunidad: 4
}

/** Cuantas observaciones comparten cada valor LITERAL de `area`. */
export function areaFrequencies(
  observations: readonly SelfObservation[]
): ReadonlyMap<string, number> {
  const cuenta = new Map<string, number>()
  for (const o of observations) cuenta.set(o.area, (cuenta.get(o.area) ?? 0) + 1)
  return cuenta
}

/** Una observacion con la frecuencia que la ordeno, para que el fichero la lleve. */
export interface ObservationConFrecuencia extends SelfObservation {
  readonly areaFrequency: number
}

/**
 * El orden del backlog: lo que MAS agentes repitieron primero, y dentro de un
 * mismo `area` lo mas urgente y lo mas reciente.
 *
 * La frecuencia se cuenta sobre el `area` LITERAL, y eso INFRAVALORA los temas
 * reales: el campo es texto libre del agente, asi que "permisos" aparece
 * escrito de veintiuna formas distintas y ninguna suma las otras veinte. El
 * orden sigue siendo util —lo repetido sube— pero no es el mapa de temas, y por
 * eso el fichero exportado lo dice de su puno y letra en vez de callarlo.
 *
 * Agrupar de verdad exige cerrar el vocabulario de `area`, como se hizo con los
 * tipos de defecto (ADR-067). Eso es otra pieza; esto solo entrega las notas.
 */
export function ordenarObservaciones(
  observations: readonly SelfObservation[]
): readonly ObservationConFrecuencia[] {
  const frecuencia = areaFrequencies(observations)
  const conFrecuencia = observations.map((o) => ({
    ...o,
    areaFrequency: frecuencia.get(o.area) ?? 0
  }))

  return [...conFrecuencia].sort((a, b) => {
    if (a.areaFrequency !== b.areaFrequency) return b.areaFrequency - a.areaFrequency
    if (URGENCIA[a.kind] !== URGENCIA[b.kind]) return URGENCIA[a.kind] - URGENCIA[b.kind]
    return b.createdAt.localeCompare(a.createdAt)
  })
}
