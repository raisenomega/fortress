import { ordenarObservaciones, type ObservationConFrecuencia } from './observation-order'
import type { SelfObservation } from './self-observation'

/**
 * Lo que el fichero declara de si mismo. No es adorno: quien lo lee —Claude Code
 * en la terminal, o el operador dentro de seis meses— tiene que saber que el
 * orden es una aproximacion y por que, o lo tomara por un mapa de temas.
 */
const SESGO = [
  'El orden usa la frecuencia del campo `area` LITERAL, y eso INFRAVALORA los',
  'temas reales: `area` es texto libre del agente, asi que un mismo tema aparece',
  'escrito de muchas formas y ninguna suma a las otras. Lo repetido sube, pero',
  'esto NO es un mapa de temas: agruparlos de verdad exige cerrar el vocabulario',
  'de `area`, como se hizo con los tipos de defecto (ADR-067).'
].join(' ')

const COMO_USARLO = [
  'Las observaciones van en crudo y sin agrupar a proposito: agrupar por parecido',
  'es lo que sabe hacer quien lee. Este fichero solo entrega lo que faltaba.'
].join(' ')

export interface ObservationExport {
  readonly generadoEl: string
  readonly total: number
  /** Cuantos valores distintos tiene `area`: la medida del despiece. */
  readonly areasDistintas: number
  readonly sesgoDelOrden: string
  readonly comoUsarlo: string
  readonly observaciones: readonly ObservationConFrecuencia[]
}

/** El backlog entero, ordenado, con su propia advertencia dentro. */
export function buildObservationExport(
  observations: readonly SelfObservation[],
  at: string
): ObservationExport {
  const ordenadas = ordenarObservaciones(observations)
  return {
    generadoEl: at,
    total: ordenadas.length,
    areasDistintas: new Set(observations.map((o) => o.area)).size,
    sesgoDelOrden: SESGO,
    comoUsarlo: COMO_USARLO,
    observaciones: ordenadas
  }
}
