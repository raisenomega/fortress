import type { Arreglo } from './leer-arreglo'
import { permitido } from './scope-check'

/**
 * ADR-102 §3 — la regla del diff, aplicada ANTES de generar. `permitido` es la
 * misma funcion con la que `checkScope` juzga el diff real despues: el guard no
 * inventa una regla nueva, adelanta la de siempre al unico momento en que
 * todavia no se ha gastado nada. Devuelve el arreglo que no cabe, o null si
 * cabe o si el analista no lo declaro (casilla 1: se genera como hoy).
 *
 * NO ensancha la correa (casilla 4): recibe `allowed` y `allows` y no los toca.
 * Un path escrito por un agente que leyo el repo auditado no abre terreno; eso
 * lo hace el operador en `.fortress/config` o en el Terminal (ADR-012).
 */
export function arregloFueraDeCorrea(
  arreglo: Arreglo | undefined,
  allowed: readonly string[],
  allows: readonly string[]
): Arreglo | null {
  if (arreglo === undefined) return null
  return permitido(arreglo.file, allowed, allows) ? null : arreglo
}
