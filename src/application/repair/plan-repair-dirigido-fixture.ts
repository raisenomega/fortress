import type { FindingMemory } from '@domain/project/finding-memory'
import type { Candidate } from '@domain/repair/select-target'
import { hallazgo, type Bench } from './plan-repair-fixture'

/** El que la cola elegiria primero: aditivo y de un solo control, o sea la
 *  superficie minima que el selector sabe puntuar. */
export const CONTENIDO: FindingMemory = {
  ...hallazgo('f-cola', 'src/domain/a.ts'),
  title: 'falta la guarda de entrada'
}

/** El otro: en `src/infrastructure/ipc/**` —que la lista de exclusion cubre— y
 *  con DOS controles que agregar, asi que puntua peor. Teniendo al de arriba
 *  delante, la cola no lo elige nunca. */
export const APARTE = (extra: Partial<FindingMemory> = {}): FindingMemory => ({
  ...hallazgo('f-dirigido', 'src/infrastructure/ipc/graph-action-handlers.ts'),
  title: 'el canal no pasa por guardRun ni valida la entrada',
  line: 49,
  ...extra
})

/** El objetivo que el analista recibio, leido del libro de vida. */
export function objetivo(b: Bench): Candidate {
  const asiento = b.events.find((e) => e.toState === 'ANALIZADO')
  return (JSON.parse(asiento?.evidenceJson ?? '{}') as { target: Candidate }).target
}
