import type { SelfObservation } from '@domain/system/self-observation'
import type { AppContext } from '../context'

type Cerrada = Partial<SelfObservation>

/** Contexto de mentira que registra CON QUE tope se le pidio la lista: el limite
 *  lo aplica el SQL, asi que solo se puede comprobar mirando el argumento. */
export function banco(cerradas: readonly Cerrada[]): {
  readonly ctx: AppContext
  readonly tope: () => number | null
} {
  let tope: number | null = null
  const filas = cerradas.map((c, i) => ({
    id: `o-${i}`, sourceProject: 'p', kind: 'gap', area: 'grafo', note: 'n',
    status: 'atendido', reason: null, attendedBy: 'x', attendedAt: '2026-09-01', createdAt: '2026-08-01', ...c
  })) as SelfObservation[] // prettier-ignore

  const ctx = {
    selfObservations: {
      listClosed: (limite: number) => {
        tope = limite
        return filas.slice(0, limite)
      }
    }
  } as unknown as AppContext

  return { ctx, tope: () => tope }
}
