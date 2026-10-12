import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import { cancelRun, endMerge, endRun, isCancelled, tryBeginRun } from './run-control'
import { guardMerge, guardRun } from './run-guard'

// PASO 172a: el breaker solo congela el repo PROPIO. Aqui el proyecto ES FORTRESS
// (self-repair), asi que la contaminacion lo frena como siempre.
vi.mock('./system/self-project', () => ({ isFortressRepo: () => true, selfProject: () => null }))

/** Contexto con el tope diario ya reventado, para probar que a la firma no le importa. */
function context(contaminated = false, gastado = 9999): AppContext {
  return {
    projects: { findById: () => ({ contaminated }) },
    settings: { get: (k: string) => (k === 'budget_per_day_usd' ? '10' : null) },
    runs: { usageSince: () => ({ costUsd: gastado }) }
  } as unknown as AppContext
}

afterEach(() => {
  endRun('p')
  endMerge('p')
})

describe('firmar mientras el motor trabaja', () => {
  it('el drenaje tiene su turno y la firma consigue el suyo', () => {
    // Es el caso que dejaba el modo inservible: media hora de drenaje con el
    // proyecto cerrado a una firma que ni siquiera entra en sus worktrees.
    expect(tryBeginRun('p')).toBe(true)
    expect(guardMerge(context(), 'p')).toBeNull()
  })

  it('y al revés: firmar no impide que el motor arranque', () => {
    expect(guardMerge(context(), 'p')).toBeNull()
    expect(guardRun(context(false, 0), 'p')).toBeNull()
  })

  it('soltar la firma NO borra la cancelacion del motor', () => {
    // endRun limpia `cancelled`; si la firma lo usara, pararia de parar al
    // drenaje justo cuando el operador acaba de pedirle que pare.
    tryBeginRun('p')
    cancelRun('p')
    endMerge('p')
    expect(isCancelled('p')).toBe(true)
  })
})

describe('la firma sigue excluida consigo misma', () => {
  it('dos integraciones a la vez no: la rama activa es una sola', () => {
    expect(guardMerge(context(), 'p')).toBeNull()
    expect(guardMerge(context(), 'p')).toContain('integrando otra propuesta')
  })

  it('otro proyecto no espera al primero', () => {
    expect(guardMerge(context(), 'p')).toBeNull()
    expect(guardMerge(context(), 'otro')).toBeNull()
    endMerge('otro')
  })
})

describe('que mira la firma y que no', () => {
  it('el tope diario NO la frena: no gasta un token', () => {
    expect(guardMerge(context(false, 9999), 'p')).toBeNull()
  })

  it('el circuit breaker SI la frena: mergear es volver a tocar el proyecto', () => {
    expect(guardMerge(context(true), 'p')).toContain('CONTAMINADO')
  })

  it('un breaker que bloquea NO deja el turno reservado', () => {
    expect(guardMerge(context(true), 'p')).toContain('CONTAMINADO')
    expect(guardMerge(context(false), 'p')).toBeNull()
  })
})
