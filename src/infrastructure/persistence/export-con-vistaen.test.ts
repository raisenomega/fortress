import { describe, expect, it } from 'vitest'
import { buildObservationExport } from '@domain/system/observation-export'
import { createMemoryDb } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

const LIMITE = { kind: 'limitacion' as const, area: 'permisos-de-herramienta' as const, note: 'n' }

describe('el fichero exportado lleva la senal', () => {
  it('una observacion vista en dos proyectos sale con vistaEn 2', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    r.add({ ...LIMITE, sourceProject: 'acme' })
    r.add({ ...LIMITE, sourceProject: 'beta' })

    const json = buildObservationExport(r.listOpen(), '2026-09-11', (id) => r.vistaEn(id))

    expect(json.observaciones).toHaveLength(1)
    expect(json.observaciones[0].vistaEn).toBe(2)
    expect(JSON.stringify(json)).toContain('"vistaEn":2')
  })

  it('y el fichero ya NO arrastra la advertencia que dejo de ser verdad', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    r.add({ ...LIMITE, sourceProject: 'acme' })

    const json = buildObservationExport(r.listOpen(), '2026-09-11', (id) => r.vistaEn(id))

    expect(json.comoOrdena).toContain('PROYECTOS distintos')
    expect(JSON.stringify(json)).not.toContain('INFRAVALORA')
  })
})
