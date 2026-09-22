import { aTipoDeDefecto, type TipoDeDefecto } from '../scan/tipo-de-defecto'
import { isSeverity } from '../shared/severity'
import { findingIdentity } from './finding-identity'

/** Una viva en `otro`, con lo que el re-tipado necesita y nada mas. */
export interface FilaOtro {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly severity: string
  readonly identity: string
  readonly simbolo: string | null
  readonly firstSeen: string
}

/** Lo que devuelve el agente por hallazgo, sin fiarse de nada. */
export interface RespuestaDeRetipado {
  readonly id: string
  readonly tipo?: unknown
  readonly razon?: unknown
}

export type Retipado =
  | { readonly id: string; readonly desenlace: 'retipada'; readonly tipo: TipoDeDefecto; readonly identidad_nueva: string; readonly razon: string } // prettier-ignore
  | { readonly id: string; readonly desenlace: 'sigue_otro'; readonly razon: string; readonly nota: string | null } // prettier-ignore
  | { readonly id: string; readonly desenlace: 'sin_decidir'; readonly motivo: string }

const razonDe = (r: RespuestaDeRetipado): string => (typeof r.razon === 'string' ? r.razon : '')

/**
 * Lo que el lote dijo de cada `otro` (ADR-100 §5). Tres salidas y ninguna
 * inventa: la clase que el agente eligio de la lista, con la identidad de hoy
 * que sale de ella; `otro` si el agente lo dijo o si nombro algo fuera del
 * vocabulario —se anota, no se fuerza—; y `sin_decidir` si no contesto o
 * contesto sin sentido, que no se escribe y se dice. NO toca el simbolo: es
 * dato del escaner, y la identidad no lo lleva (ADR-084).
 */
export function retipar(
  filas: readonly FilaOtro[],
  respuestas: readonly RespuestaDeRetipado[]
): readonly Retipado[] {
  const porId = new Map(respuestas.map((r) => [r.id, r]))
  return filas.map((f) => {
    const r = porId.get(f.id)
    if (r === undefined)
      return { id: f.id, desenlace: 'sin_decidir', motivo: 'sin respuesta del agente' }
    if (typeof r.tipo !== 'string')
      return { id: f.id, desenlace: 'sin_decidir', motivo: `tipo ilegible: ${String(r.tipo)}` }
    const tipo = aTipoDeDefecto(r.tipo)
    if (tipo === 'otro') return { id: f.id, desenlace: 'sigue_otro', razon: razonDe(r), nota: r.tipo === 'otro' ? null : `tipo fuera del vocabulario: ${r.tipo}` } // prettier-ignore
    const severity = isSeverity(f.severity) ? f.severity : 'MEDIUM'
    const identidad_nueva = findingIdentity({ severity, title: f.title, file: f.file, line: f.line, tipo }) // prettier-ignore
    return { id: f.id, desenlace: 'retipada', tipo, identidad_nueva, razon: razonDe(r) }
  })
}
