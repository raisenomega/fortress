import { parsePatterns } from './parse-patterns'
import { historyKey } from './pattern-id'
import { splitSections } from './sections'

/**
 * Fecha de primera deteccion ya registrada, por hallazgo, leida del log que
 * existe. Es lo que permite CAMBIAR de esquema de ids sin perder historia: el
 * id nuevo se calcula del contenido, pero la fecha se hereda de la entrada
 * vieja reconociendola por titulo y severidad.
 *
 * Gana la primera aparicion: el log se lee de arriba abajo y arriba estan los
 * patrones activos, que son los que llevan `Primera deteccion`.
 */
export function readFirstSeen(existing: string): ReadonlyMap<string, string> {
  const seen = new Map<string, string>()

  for (const pattern of parsePatterns(splitSections(existing))) {
    if (pattern.severity === null || pattern.detectedAt === null) continue

    const key = historyKey(pattern.severity, pattern.title)
    if (!seen.has(key)) seen.set(key, pattern.detectedAt)
  }

  return seen
}
