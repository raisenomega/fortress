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

/** Cuantas observaciones comparten cada `area`. Desde que el vocabulario esta
 *  cerrado esto agrupa de verdad; antes contaba formas de escribir. */
export function areaFrequencies(
  observations: readonly SelfObservation[]
): ReadonlyMap<string, number> {
  const cuenta = new Map<string, number>()
  for (const o of observations) cuenta.set(o.area, (cuenta.get(o.area) ?? 0) + 1)
  return cuenta
}

/** Una observacion con lo que la ordeno, para que el fichero lo lleve. */
export interface ObservationConFrecuencia extends SelfObservation {
  readonly areaFrequency: number
  /** En cuantos PROYECTOS distintos se ha visto (ADR-085, Fase 4). */
  readonly vistaEn: number
}

/**
 * El orden del backlog: lo que se topo MAS CLIENTES primero.
 *
 * `vistaEn` manda, y ese cambio es el arco entero (ADR-085, Fase 4). Antes
 * mandaba la frecuencia del `area` LITERAL, y eso premiaba el ruido: una queja
 * repetida treinta veces en UN proyecto subia por encima de una que tres
 * clientes distintos se habian encontrado. La segunda dice «esto le falta a
 * FORTRESS en todos los stacks»; la primera solo dice que un escaneo tiene doce
 * paradas. El orden viejo no las distinguia porque el esquema tampoco.
 *
 * `areaFrequency` sigue detras y ahora SI agrupa: con el vocabulario cerrado,
 * las veintiseis formas de escribir «permisos» suman entre ellas en vez de
 * contar por separado. Las filas anteriores al vocabulario conservan su texto
 * libre y por eso no agrupan — su reclasificacion es otro gesto.
 */
export function ordenarObservaciones(
  observations: readonly SelfObservation[],
  vistaEn: (id: string) => number = () => 0
): readonly ObservationConFrecuencia[] {
  const frecuencia = areaFrequencies(observations)
  const conOrden = observations.map((o) => ({
    ...o,
    areaFrequency: frecuencia.get(o.area) ?? 0,
    vistaEn: vistaEn(o.id)
  }))

  return [...conOrden].sort((a, b) => {
    if (a.vistaEn !== b.vistaEn) return b.vistaEn - a.vistaEn
    if (a.areaFrequency !== b.areaFrequency) return b.areaFrequency - a.areaFrequency
    if (URGENCIA[a.kind] !== URGENCIA[b.kind]) return URGENCIA[a.kind] - URGENCIA[b.kind]
    return b.createdAt.localeCompare(a.createdAt)
  })
}
