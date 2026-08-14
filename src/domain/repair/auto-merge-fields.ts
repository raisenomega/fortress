import { isSeverity, type Severity } from '../shared/severity'

/**
 * Validadores de los campos que un proyecto puede declarar. Cada uno devuelve
 * el valor limpio o null; null significa "el campo esta y no sirve", que es
 * distinto de "el campo no esta" — esa diferencia la resuelve quien llama.
 */

export const flag = (raw: unknown): boolean | null => (typeof raw === 'boolean' ? raw : null)

export const severidades = (raw: unknown): readonly Severity[] | null =>
  Array.isArray(raw) && raw.length > 0 && raw.every(isSeverity) ? (raw as Severity[]) : null

export const entero = (raw: unknown): number | null =>
  typeof raw === 'number' && Number.isInteger(raw) && raw > 0 ? raw : null

export const rutas = (raw: unknown): readonly string[] | null =>
  Array.isArray(raw) && raw.every((r) => typeof r === 'string') ? (raw as string[]) : null
