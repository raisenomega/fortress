import type { ImpactoDeHallazgo } from '@domain/build/marco-de-impacto'
import { moduloDe } from '@domain/build/marco-de-impacto'

const TOPE_MOD = 4

export type Traza = Pick<ImpactoDeHallazgo, 'callers' | 'callees' | 'modulos'>

/** Las filas de un `query_graph` (1a columna), o []. Sin `rows` array (p.ej. un
 *  `{"error":...,available_projects}`) no hay filas: el error no se vuelve nada. */
export function filasDeQuery(salida: string): readonly string[] {
  try {
    const j = JSON.parse(salida) as { rows?: unknown[][] }
    return Array.isArray(j.rows) ? j.rows.map((r) => String(r[0])) : []
  } catch {
    return []
  }
}

/** La traza -> callers/callees/modulos, o null. Rechaza `{"error":...}` (sin
 *  `callers` array): el error del binario NUNCA se convierte en impacto, ni
 *  filtra `available_projects`. */
export function parseTrace(salida: string): Traza | null {
  let j: { callers?: { qualified_name?: string }[]; callees?: unknown[] }
  try {
    j = JSON.parse(salida)
  } catch {
    return null
  }
  if (!Array.isArray(j.callers) || !Array.isArray(j.callees)) return null
  const modulos = [...new Set(j.callers.map((c) => moduloDe(c.qualified_name ?? '?')))]
  return {
    callers: j.callers.length,
    callees: j.callees.length,
    modulos: modulos.slice(0, TOPE_MOD)
  }
}
