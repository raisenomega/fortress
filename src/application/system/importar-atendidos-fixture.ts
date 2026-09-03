import type { SelfObservation } from '@domain/system/self-observation'
import type { CambioDeEstado } from '@domain/system/self-observation-repository'
import type { AppContext } from '../context'

/** Base en memoria de mentira, pero con la MISMA semantica que la de verdad:
 *  `setStatus` solo cambia lo que existe, y `findById` ve el estado actual. */
export function banco(ids: readonly string[]): {
  readonly ctx: AppContext
  readonly estado: (id: string) => SelfObservation | null
  readonly transacciones: () => number
} {
  const filas = new Map<string, SelfObservation>(
    ids.map((id) => [id, { id, sourceProject: 'p', kind: 'gap', area: 'a', note: 'n', status: 'pendiente', reason: null, attendedBy: null, attendedAt: null, createdAt: '2026-08-01' }]) // prettier-ignore
  )
  let vueltas = 0

  const ctx = {
    selfObservations: {
      findById: (id: string) => filas.get(id) ?? null,
      setStatus: (c: CambioDeEstado) => {
        const fila = filas.get(c.id)
        if (fila === undefined) return false
        filas.set(c.id, { ...fila, status: c.status, reason: c.reason, attendedBy: c.attendedBy, attendedAt: c.attendedAt }) // prettier-ignore
        return true
      }
    },
    transaction: <T>(work: () => T): T => {
      vueltas += 1
      return work()
    }
  } as unknown as AppContext

  return { ctx, estado: (id) => filas.get(id) ?? null, transacciones: () => vueltas }
}
