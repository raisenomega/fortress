import { describe, expect, it } from 'vitest'
import { RUTA_REDACTADA } from '@domain/system/cerco-de-observacion'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'
import type { AppContext } from '@application/context'
import { asentarNotas } from '@application/system/asentar-notas'

const PROYECTO = { id: 'p1', name: 'Cliente ACME', path: '/media/disco/ACME' } as never

function banco(): { context: AppContext; leer: () => Array<{ area: string; note: string }> } {
  const db = createMemoryDb()
  seedProject(db, 'p1')
  const repo = createSqliteSelfObservationRepository(db)
  return {
    context: { selfObservations: repo } as unknown as AppContext,
    leer: () => repo.listOpen().map((o) => ({ area: o.area, note: o.note }))
  }
}

describe('el asiento comun de los tres agentes', () => {
  it('EL CERCO LOS CUBRE SIN RE-CABLEARSE: vive en `add`, y todos pasan por el', () => {
    // Es el dividendo de la Fase 1: ninguno de los tres agentes nuevos llama al
    // cerco ni sabe que existe. Pasan por `add`, y `add` es el cuello de botella.
    const b = banco()

    asentarNotas(b.context, PROYECTO, [
      { kind: 'gap', area: 'consulta-del-grafo', note: 'no hay nodo para supabase/functions/x.ts:40' }
    ])

    const [nota] = b.leer()
    expect(nota.note).not.toContain('supabase/functions/x.ts:40')
    expect(nota.note).toContain(RUTA_REDACTADA)
    expect(nota.note).toContain('no hay nodo para')
  })

  it('y la RAIZ absoluta tambien, porque el projectPath viaja al cerco', () => {
    const b = banco()

    asentarNotas(b.context, PROYECTO, [
      { kind: 'bug', area: 'contrato-del-hallazgo', note: 'no pudo leer /media/disco/ACME entero' }
    ])

    expect(b.leer()[0].note).not.toContain('/media/disco/ACME')
  })
})

describe('el escaner no inunda: doce paradas, una fila', () => {
  it('doce copias de la misma queja se funden ANTES de escribir', () => {
    const b = banco()
    const doce = Array.from({ length: 12 }, () => ({
      kind: 'limitacion' as const,
      area: 'consulta-del-grafo' as const,
      note: 'el grafo no modela politicas RLS'
    }))

    expect(asentarNotas(b.context, PROYECTO, doce)).toBe(1)
    expect(b.leer()).toHaveLength(1)
  })

  it('pero doce quejas distintas entran las doce: no se pierde senal', () => {
    const b = banco()
    const distintas = Array.from({ length: 12 }, (_, i) => ({
      kind: 'gap' as const,
      area: 'otro' as const,
      note: `limite ${i}`
    }))

    expect(asentarNotas(b.context, PROYECTO, distintas)).toBe(12)
  })
})
