import type { AppContext } from '@application/context'
import type { OperationMode } from '@domain/settings/operation-mode'
import { createMemoryDb } from './persistence/memory-db'
import { createSqliteSelfObservationRepository } from './persistence/sqlite-self-observation-repository'
import { proyectoConHook } from './project/path-de-prueba'

export { pathSinPython, restaurarPath } from './project/path-de-prueba'
export const conHooks = proyectoConHook

export const ROTO = 'python .claude/hooks/protect-invariants.py'
export const SANO = 'python3 .claude/hooks/protect-invariants.py'

export interface Cliente {
  readonly id: string
  readonly name: string
  readonly path: string
}

/** Un solo cliente, que es el caso de casi todos los tests. */
export const unCliente = (path: string): readonly Cliente[] => [
  { id: 'p1', name: 'Cliente ACME', path }
]

const bases = new WeakMap<AppContext, ReturnType<typeof createMemoryDb>>()

/**
 * Contexto con el backlog REAL en SQLite —la dedup y los avistamientos viven en
 * el SQL, y con un doble no se probarian— y el modo servido desde `settings`,
 * que es de donde `esAutonomoDeVerdad` lo lee.
 */
export function banco(clientes: readonly Cliente[], modo: OperationMode): AppContext {
  const db = createMemoryDb()
  const ctx = {
    projects: { findById: (id: string) => clientes.find((c) => c.id === id) ?? null },
    selfObservations: createSqliteSelfObservationRepository(db),
    settings: { get: () => modo }
  } as unknown as AppContext

  bases.set(ctx, db)
  return ctx
}

/** FILAS de `observation_sightings`, que es otra cosa que `vistaEn`: aquella
 *  cuenta PROYECTOS distintos y no se mueve por mucho que se repita el mismo. */
export function filasDeAvistamiento(ctx: AppContext): number {
  const fila = bases.get(ctx)?.prepare('SELECT COUNT(*) n FROM observation_sightings').get()
  return (fila as { n: number }).n
}
