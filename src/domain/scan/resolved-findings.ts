import { fingerprintOf } from '../project/finding-fingerprint'
import type { DetectedFinding } from './detected-finding'

/**
 * Hallazgos que estaban ABIERTOS antes y ya NO aparecen en el escaneo nuevo: se
 * RESOLVIERON. No desaparecen sin rastro — el motor los EXTINGUE con evidencia
 * (COGNITION). Identidad por huella (severidad+archivo+linea+titulo), estable
 * entre escaneos, la misma que hereda un descarte. Asi FORTRESS reconoce su
 * propio progreso: un control que se agrego cierra el hallazgo que lo pedia.
 */
export function resolvedFindings(
  previous: readonly DetectedFinding[],
  current: readonly DetectedFinding[]
): readonly DetectedFinding[] {
  const stillOpen = new Set(current.map(fingerprintOf))
  return previous.filter((finding) => !stillOpen.has(fingerprintOf(finding)))
}
