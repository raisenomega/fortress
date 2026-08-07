/** Las 6 dimensiones del score integral. Los pesos suman 100. */
export type DimensionKey =
  'seguridad' | 'correctitud' | 'tests' | 'mantenibilidad' | 'dependencias' | 'operacion'

export interface Dimension {
  readonly key: DimensionKey
  readonly label: string
  readonly weight: number
}

/** Score por dimension (null = sin datos), como se persiste y se muestra. */
export type DimensionScores = Readonly<Record<DimensionKey, number | null>>

/** Orden y pesos acordados. El global es la media ponderada de las MEDIDAS. */
export const DIMENSIONS: readonly Dimension[] = [
  { key: 'seguridad', label: 'Seguridad', weight: 30 },
  { key: 'correctitud', label: 'Correctitud', weight: 20 },
  { key: 'tests', label: 'Tests', weight: 15 },
  { key: 'mantenibilidad', label: 'Mantenibilidad', weight: 15 },
  { key: 'dependencias', label: 'Dependencias', weight: 10 },
  { key: 'operacion', label: 'Operacion', weight: 10 }
]
