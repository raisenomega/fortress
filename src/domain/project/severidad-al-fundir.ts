import type { Severity } from '../shared/severity'
import type { FilaAFusionar, Fusion } from './fusion-de-duplicados'

/** La severidad no entra en el PLAN —decidir no la necesita— pero si en lo que
 *  queda escrito, asi que viaja aparte, con la fila. */
export interface FilaConSeveridad extends FilaAFusionar {
  readonly severity: Severity
}

/**
 * Que severidad debe quedar cuando dos filas resultan ser una.
 *
 * Hasta ahora ninguna: la fusion escribia solo las absorbidas y la superviviente
 * conservaba la suya por OMISION. Como gana la mas antigua (ADR-071) y la
 * severidad no entra ni en la identidad ni en el desempate, un grupo mixto
 * perdia la gravedad mas alta al fundirse. No es hipotetico: de las cinco
 * fusiones reales del 24 de agosto, DOS degradaron —un HIGH de la correa de
 * alcance quedo en MEDIUM y un MEDIUM de la config MCP quedo en LOW—, y el
 * tablero de FORTRESS lleva desde entonces puntuando por debajo.
 *
 * La regla: gana la misma fila de siempre —su `first_seen` es la historia real
 * del defecto— pero se queda con la severidad MAXIMA del grupo. Fundir deja de
 * poder bajar la gravedad; solo puede subirla o dejarla igual.
 *
 * NO importa nada en tiempo de ejecucion —recibe `masUrgente`— porque las dos
 * rutas que fusionan tienen que consumir ESTA funcion y no una copia: una es la
 * del dominio y la otra un script suelto, que no resuelve alias ni imports sin
 * extension (deuda `contrato-scan-no-importable-desde-script`).
 */
export function severidadDeLaSuperviviente(
  fusion: Fusion,
  porId: ReadonlyMap<string, Severity>,
  masUrgente: (severities: readonly Severity[]) => Severity
): Severity {
  const delGrupo = [fusion.ganadora, ...fusion.absorbidas]
    .map((id) => porId.get(id))
    .filter((s): s is Severity => s !== undefined)

  // Vacio solo si a quien llama le faltan las filas de las que salio el plan:
  // es un fallo de cableado, no un caso de datos, y callarlo escribiria una
  // severidad inventada sobre el tablero.
  if (delGrupo.length === 0) throw new Error(`fusion sin severidades: ${fusion.identidad}`)
  return masUrgente(delGrupo)
}

/**
 * Si una superviviente quedo por DEBAJO de su grupo. Como la maxima incluye la
 * suya, que difieran ya significa que la de ella es menor: no hace falta
 * comparar en otro sentido, y asi hay una sola autoridad sobre el orden.
 */
export function porDebajoDeSuGrupo(
  actual: Severity,
  delGrupo: readonly Severity[],
  masUrgente: (severities: readonly Severity[]) => Severity
): boolean {
  return masUrgente([actual, ...delGrupo]) !== actual
}
