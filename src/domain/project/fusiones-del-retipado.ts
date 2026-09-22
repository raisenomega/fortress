import { planDeFusion, type FilaAFusionar, type Fusion } from './fusion-de-duplicados'
import type { Retipado } from './retipado-de-otros'

/**
 * Lo que quedaria REPETIDO despues de re-tipar (ADR-100 §5): las vivas de hoy,
 * con cada re-tipada llevando ya su clave nueva en vez de la de `otro`.
 *
 * El caso real: `send-invoice:268` tiene una fila `otro` del 7-sep y una
 * `rate-limit-ausente` del 8-sep; si la primera se re-tipa a rate limit, son la
 * misma fila y la mas antigua sobrevive (ADR-071). Una que siga `otro` conserva
 * su clave y no funde con nadie. Una re-tipada que no este entre las vivas no
 * es un dato: es un fallo de cableado, y se lanza.
 */
export function fusionesDelRetipado(
  vivas: readonly FilaAFusionar[],
  retipados: readonly Retipado[]
): readonly Fusion[] {
  const nuevas = new Map(retipados.flatMap((r) => (r.desenlace === 'retipada' ? [[r.id, r.identidad_nueva] as const] : []))) // prettier-ignore
  const ids = new Set(vivas.map((v) => v.id))
  for (const id of nuevas.keys())
    if (!ids.has(id)) throw new Error(`retipada que no esta viva: ${id}`)
  return planDeFusion(vivas.map((v) => ({ ...v, identidad: nuevas.get(v.id) ?? v.identidad })))
}
