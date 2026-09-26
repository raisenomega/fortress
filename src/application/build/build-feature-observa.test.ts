import { describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import type { Project } from '@domain/project/project'
import { createMemoryDb } from '../../infrastructure/persistence/memory-db'
import { createSqliteSelfObservationRepository } from '../../infrastructure/persistence/sqlite-self-observation-repository'
import { buildFeature } from './build-feature'
import { agentOf, deps, reply } from './build-feature-fixtures'

const BLOQUE =
  'NOTAS:[{"kind":"limitacion","area":"otro","note":"sin red no pude instalar"}]:END-NOTAS'

function ctx(): AppContext {
  const project = { id: 'p1', name: 'Cliente ACME', path: '/tmp/p', trusted: true } as Project
  return {
    projects: { findById: () => project },
    selfObservations: createSqliteSelfObservationRepository(createMemoryDb())
  } as unknown as AppContext
}

describe('el Ejecutor de Construir observa (sub-pieza 3 del #5)', () => {
  it('asienta la nota y el texto del resultado NO lleva el bloque', async () => {
    const c = ctx()
    const r = await buildFeature(c, 'p1', 'i', 'plan', agentOf(reply({ text: `Hecho.\n\n${BLOQUE}` })), deps(), () => {}) // prettier-ignore

    expect(c.selfObservations.listOpen()).toMatchObject([{ kind: 'limitacion', area: 'otro' }])
    expect(r.ok && r.value.text).toBe('Hecho.')
  })

  it('y con el agente en FALLO la nota entra igual, y el error vuelve limpio', async () => {
    const c = ctx()
    const r = await buildFeature(c, 'p1', 'i', 'plan', agentOf(reply({ text: `Rompi algo.\n${BLOQUE}`, failed: true })), deps(), () => {}) // prettier-ignore

    expect(c.selfObservations.listOpen()).toHaveLength(1)
    expect(r).toEqual({ ok: false, error: 'Rompi algo.' })
  })
})
