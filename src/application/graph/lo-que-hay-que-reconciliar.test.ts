import { describe, expect, it } from 'vitest'
import { bench } from './reconcile-graph-fixture'
import { reconcileGraph } from './reconcile-graph'

/**
 * Las precondiciones se prueban A TRAVES de `reconcileGraph` y no llamando al
 * modulo a pelo: lo que hay que sostener es que las tres puertas del reindex
 * —arranque, chip del grafo y foco de proyecto— se rinden, y las tres entran
 * por ahi. Probar el modulo suelto dejaria de comprobar que alguien lo llama.
 */
describe('cuando no hay nada que reconciliar', () => {
  it('proyecto sin repo git: SKIPPED sin tocar estado', async () => {
    const b = bench({ sha: null })
    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('SKIPPED')
    expect(b.marks).toEqual([])
  })

  it('proyecto inexistente: SKIPPED', async () => {
    const b = bench()
    expect(await reconcileGraph(b.context, 'nope', b.deps)).toBe('SKIPPED')
  })

  it('proyecto CONTAMINADO: SKIPPED sin tocar estado', async () => {
    // Defensa LATENTE: con la base de hoy (cero contaminados) el freno no se ve
    // por ningun lado, y esta prueba es lo unico que dice que existe.
    const b = bench({ contaminado: true })
    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('SKIPPED')
    expect(b.marks).toEqual([])
  })

  it('y no condena: desbloqueado (markClean) vuelve a reindexar', async () => {
    // El reproche que hundio el intento anterior de este freno era que dejaria
    // un proyecto sin indexar para siempre. Ya no: la marca se relee.
    const b = bench({ contaminado: false })
    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('STARTED')
    expect(b.marks).toEqual(['running'])
  })
})
