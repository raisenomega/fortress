import type { Hermano } from './hermanos-del-hallazgo'

const donde = (h: Hermano): string => (h.line === null ? h.file : `${h.file}:${h.line}`)

/** `[id] fichero:linea — titulo`. El id va delante para que "mismoDefectoQue"
 *  pueda nombrarlo sin ambiguedad (ADR-101, corte 2). */
export const cita = (h: Hermano): string => `[${h.id}] ${donde(h)} — ${h.title}`

export const quedan = (
  todos: readonly Hermano[],
  citados: readonly Hermano[],
  de: string
): string[] =>
  todos.length > citados.length ? [`(y ${todos.length - citados.length} mas de la ${de})`] : []

export const SEDE = (n: number): string =>
  `Otros ${n} hallazgos abiertos en tu MISMA SEDE (mismo fichero y simbolo, o a pocas lineas): candidatos a ser el MISMO defecto. Si alguno lo es, ponlo en "mismoDefectoQue" con su id entre corchetes.` // prettier-ignore
export const CLASE = (n: number, tipo: string | null): string =>
  `Otros ${n} hallazgos abiertos de tu MISMA CLASE (${tipo}) en otras sedes: probablemente defectos distintos.` // prettier-ignore
export const CORREA =
  'NO los arregles ni los cites como where: la correa de este fix sale de su ancla.'
