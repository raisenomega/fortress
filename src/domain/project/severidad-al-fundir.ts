import type { Severity } from '../shared/severity'
import type { FilaAFusionar, Fusion } from './fusion-de-duplicados'

/** La severidad no entra en el PLAN —decidir no la necesita— pero si en lo que
 *  queda escrito, asi que viaja aparte, con la fila. */
export interface FilaConSeveridad extends FilaAFusionar {
  readonly severity: Severity
}

/**
 * Que severidad queda cuando dos filas resultan ser una: la MAXIMA del grupo, no
 * la de la superviviente. Gana la misma fila de siempre —su `first_seen` es la
 * historia real del defecto (ADR-071)— pero fundir deja de poder bajar la
 * gravedad. Por que hizo falta la enmienda: ver ADR-071.
 *
 * Este modulo NO importa nada en tiempo de ejecucion —recibe `masUrgente`—
 * porque las dos rutas que fusionan tienen que consumir ESTAS funciones y no una
 * copia: una es del dominio y la otra un script suelto, que no resuelve alias ni
 * imports sin extension (deuda `contrato-scan-no-importable-desde-script`).
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

/** Una superviviente viva con la severidad de UNA de sus absorbidas. Es la forma
 *  en la que la base puede contar los grupos DESPUES de fundir: la absorbida
 *  dice de quien es en `extinct_reason`, y no queda otro hilo. */
export interface Pareja {
  readonly id: string
  readonly viva: Severity
  readonly absorbida: Severity
}

export interface Degradada {
  readonly id: string
  readonly viva: Severity
  readonly maxima: Severity
}

/**
 * La red (criterio 6): que supervivientes quedaron por DEBAJO de su grupo.
 *
 * DECIDE y no lanza: quien lanza es la cascara del script, y asi la decision
 * —que es lo unico que puede equivocarse— corre en el gate. Como la maxima
 * incluye la de la superviviente, que difieran ya significa que la suya es
 * menor: una sola autoridad sobre el orden, sin comparar en dos sentidos.
 *
 * Devuelve la lista y no un booleano: el fallo tiene que decir CUAL quedo baja.
 */
export function supervivientesDegradadas(
  parejas: readonly Pareja[],
  masUrgente: (severities: readonly Severity[]) => Severity
): readonly Degradada[] {
  const porGanadora = new Map<string, Severity[]>()
  for (const p of parejas) {
    porGanadora.set(p.id, [...(porGanadora.get(p.id) ?? [p.viva]), p.absorbida])
  }

  const vivaDe = new Map(parejas.map((p) => [p.id, p.viva]))
  return [...porGanadora]
    .map(([id, grupo]) => ({ id, viva: vivaDe.get(id) as Severity, maxima: masUrgente(grupo) }))
    .filter((d) => d.maxima !== d.viva)
}
