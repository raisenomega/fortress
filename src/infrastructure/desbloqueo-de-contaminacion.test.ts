import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { ProjectRepository } from '@domain/project/project-repository'
import { createMemoryDb, seedProject } from './persistence/memory-db'
import { createSqliteProjectRepository } from './persistence/sqlite-project-repository'
import { endMerge, endRun } from './run-control'
import { guardMerge, guardRun } from './run-guard'

// PASO 172a: el proyecto sembrado se trata como FORTRESS (el breaker solo congela
// el repo propio) para probar que markClean reabre la puerta.
vi.mock('./system/self-project', () => ({ isFortressRepo: () => true, selfProject: () => null }))

let projects: ProjectRepository

/**
 * La base es REAL, no un doble: lo afirmado no es que el breaker lea un booleano
 * —eso ya esta probado— sino que el UPDATE lo produzca. `contaminated` no es una
 * columna: nace de `contaminated_at !== null`, y un doble lo daria por hecho.
 */
function context(): AppContext {
  return {
    projects,
    settings: { get: () => null },
    runs: { usageSince: () => ({ costUsd: 0 }), sinFacturaSince: () => ({ runs: 0 }) }
  } as unknown as AppContext
}

beforeEach(() => {
  const db = createMemoryDb()
  seedProject(db, 'p')
  projects = createSqliteProjectRepository(db)
})

afterEach(() => {
  endRun('p')
  endMerge('p')
})

describe('markClean: revisado el forense, el proyecto vuelve a circulacion', () => {
  it('abre guardRun, y con el MISMO contexto: el breaker relee, no recuerda', () => {
    const ctx = context()
    projects.markContaminated('p', 'el arbol quedo sucio tras la auditoria')
    expect(guardRun(ctx, 'p')).toContain('CONTAMINADO')

    projects.markClean('p')

    // `findById` es un SELECT por llamada: el UPDATE abre la puerta en el acto.
    expect(guardRun(ctx, 'p')).toBeNull()
  })

  it('abre tambien guardMerge, que el breaker frena aunque no gaste tokens', () => {
    const ctx = context()
    projects.markContaminated('p', 'x')
    expect(guardMerge(ctx, 'p')).toContain('CONTAMINADO')

    projects.markClean('p')
    expect(guardMerge(ctx, 'p')).toBeNull()
  })

  it('se lleva el detalle forense: el motivo no sobrevive a su propia marca', () => {
    projects.markContaminated('p', 'sha distinto en 3 ficheros')
    expect(projects.findById('p')?.contaminationDetail).toBe('sha distinto en 3 ficheros')

    projects.markClean('p')

    expect(projects.findById('p')?.contaminated).toBe(false)
    expect(projects.findById('p')?.contaminationDetail).toBeNull()
  })

  it('sobre un proyecto ya limpio no hace nada, y no revienta', () => {
    projects.markClean('p')
    expect(projects.findById('p')?.contaminated).toBe(false)
  })
})
