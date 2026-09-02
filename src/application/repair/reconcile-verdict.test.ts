import { describe, expect, it } from 'vitest'
import { RECLAIM_REASONS } from '@domain/repair/reclaim-reasons'
import { decideOrphan } from './reconcile-verdict'

const nuncaMergeado = (): boolean => false
const yaMergeado = (): boolean => true
const REPO = '/repo/vivo'

/**
 * El ORDEN de los guards, que es lo unico que decide estos casos. Se prueba la
 * funcion pura y no el bucle: lo que se afirma es la regla, y el bucle ya tiene
 * su propio banco.
 */
describe('decideOrphan: el proyecto ausente manda sobre la fase', () => {
  it('pre-GENERATE sin proyecto: caduca por ausencia en vez de esperar', () => {
    // El caso de 752a50b8. Con el guard del commit delante salia por "ANALIZADO
    // espera al operador" y quedaba viva para siempre — y el operador al que
    // esperaba ya no tenia proyecto que mirar.
    expect(decideOrphan('ANALIZADO', null, null, nuncaMergeado)).toEqual({
      path: ['CADUCADO'],
      reason: RECLAIM_REASONS.PROYECTO_AUSENTE
    })
  })

  it('ELEGIDO sin proyecto: la razon es la ausencia, no el analisis a medias', () => {
    // Las dos son ciertas, pero la que explica por que no hay nada que hacer es
    // la ausencia; "analisis interrumpido" sugeriria que se puede reintentar.
    expect(decideOrphan('ELEGIDO', null, null, nuncaMergeado)?.reason).toBe(
      RECLAIM_REASONS.PROYECTO_AUSENTE
    )
  })

  it('con commit y sin proyecto sigue caducando por ausencia', () => {
    expect(decideOrphan('OMEGA', 'c0ffee', null, yaMergeado)?.reason).toBe(
      RECLAIM_REASONS.PROYECTO_AUSENTE
    )
  })
})

describe('decideOrphan: con el proyecto vivo nada cambia', () => {
  it('ANALIZADO sin commit sigue esperando al operador', () => {
    expect(decideOrphan('ANALIZADO', null, REPO, nuncaMergeado)).toBeNull()
  })

  it('GENERADO sin commit tampoco se toca', () => {
    expect(decideOrphan('GENERADO', null, REPO, yaMergeado)).toBeNull()
  })

  it('ELEGIDO sin commit sigue siendo analisis interrumpido', () => {
    expect(decideOrphan('ELEGIDO', null, REPO, nuncaMergeado)?.reason).toBe(
      RECLAIM_REASONS.ANALISIS_INTERRUMPIDO
    )
  })

  it('con commit y sin merge demostrable: worktree ausente', () => {
    expect(decideOrphan('OMEGA', 'c0ffee', REPO, nuncaMergeado)?.reason).toBe(
      RECLAIM_REASONS.WORKTREE_AUSENTE
    )
  })

  it('con commit ya en HEAD: el camino honesto hasta MERGEADO', () => {
    expect(decideOrphan('OMEGA', 'c0ffee', REPO, yaMergeado)).toEqual({
      path: ['APROBADO', 'MERGEADO'],
      reason: RECLAIM_REASONS.MERGE_DETECTADO
    })
  })
})
