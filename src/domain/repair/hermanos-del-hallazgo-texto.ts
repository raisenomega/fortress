import type { Hermano } from './hermanos-del-hallazgo'
import { sanearParaPrompt } from '../shared/sanear-para-prompt'

// Ruta y titulo los escribio el ESCANER, otro agente: entran aplanados, igual
// que los del hallazgo en foco (analysis-prompt). Sanear uno y no sus hermanos
// dejaba la puerta de al lado abierta.
const donde = (h: Hermano): string => {
  const file = sanearParaPrompt(h.file)
  return h.line === null ? file : `${file}:${h.line}`
}

/** `[id] fichero:linea — titulo`. El id va delante para que "mismoDefectoQue"
 *  pueda nombrarlo sin ambiguedad (ADR-101, corte 2). */
export const cita = (h: Hermano): string => `[${h.id}] ${donde(h)} — ${sanearParaPrompt(h.title)}`

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
