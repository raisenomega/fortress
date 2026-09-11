import { describe, expect, it } from 'vitest'
import { buildObservationExport } from '@domain/system/observation-export'
import { RUTA_REDACTADA } from '@domain/system/cerco-de-observacion'
import { createMemoryDb } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

/**
 * EL VECTOR, cerrado. `auto-mejora.json` es el fichero que sale de la maquina
 * del cliente; este test mira lo que de verdad viajaria.
 *
 * No se afirma sobre la nota suelta sino sobre el JSON SERIALIZADO entero: el
 * export lleva `area`, `note` y campos que podrian nacer despues, y una fuga por
 * un campo nuevo no la veria un test que solo mirase `note`.
 */
const FUGA = {
  sourceProject: 'Cliente ACME',
  projectPath: '/media/disco/Cliente ACME',
  kind: 'gap' as const,
  area: 'search_graph en supabase/functions/_shared',
  note: "trace_path devolvio ambiguous: el simbolo existe en src/lib/sanitize-html.ts:12 y el proyecto entero vive en /media/disco/Cliente ACME" // prettier-ignore
}

describe('el fichero que sale de la maquina del cliente', () => {
  it('no lleva ni una ruta del proyecto auditado', () => {
    const db = createMemoryDb()
    createSqliteSelfObservationRepository(db).add(FUGA)

    const repo = createSqliteSelfObservationRepository(db)
    const json = JSON.stringify(buildObservationExport(repo.listOpen(), '2026-09-11'))

    expect(json).not.toContain('supabase/functions')
    expect(json).not.toContain('src/lib/sanitize-html.ts')
    expect(json).not.toContain('/media/disco/Cliente ACME')
    expect(json).toContain(RUTA_REDACTADA)
  })

  it('y si lleva el aprendizaje: redactar no es vaciar', () => {
    const db = createMemoryDb()
    createSqliteSelfObservationRepository(db).add(FUGA)

    const repo = createSqliteSelfObservationRepository(db)
    const [obs] = buildObservationExport(repo.listOpen(), '2026-09-11').observaciones

    expect(obs.note).toContain('trace_path devolvio ambiguous')
    expect(obs.note).toContain('el simbolo existe en')
    // El nombre del proyecto SI viaja, y debe: es de quien es la observacion, y
    // el operador ya sabe con que clientes trabaja. Lo que no puede viajar es su
    // CODIGO.
    expect(obs.sourceProject).toBe('Cliente ACME')
  })
})
