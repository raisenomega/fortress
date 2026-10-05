import type { GateOutcome } from './gate-result'

/** Los pasos del gate cuyo rojo es del CODIGO del fix, y por tanto arreglable por
 *  el generador. `npm ci`, los timeouts y la falta de scripts son del entorno. */
const DE_CODIGO: readonly string[] = ['typecheck', 'lint', 'test:unit']

export interface RojoReanudable {
  readonly failedAt: string
  readonly errores: readonly string[]
}

/**
 * ADR-115 B2: si un rojo del gate se le puede devolver al generador. Solo el rojo
 * PROPIO de codigo (`gate_failed` en typecheck, lint o test:unit), nunca el
 * invariante de los heredados (`gate-sequence`: su `failedAt` es uno heredado), y
 * solo si A1 trajo lineas de error: sin ellas no hay nada que darle, y se queda
 * terminal como siempre.
 */
export function rojoReanudable(o: GateOutcome): RojoReanudable | null {
  if (o.ok || o.reason !== 'gate_failed' || !DE_CODIGO.includes(o.failedAt)) return null
  if ((o.heredado ?? []).includes(o.failedAt)) return null
  const roto = o.commands.at(-1)
  if (roto?.command !== o.failedAt) return null
  const errores = roto.errores ?? []
  return errores.length > 0 ? { failedAt: o.failedAt, errores } : null
}
