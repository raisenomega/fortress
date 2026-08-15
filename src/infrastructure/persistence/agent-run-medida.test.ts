import { describe, expect, it } from 'vitest'
import { AYER, banco, corrida, MEDIANOCHE } from './agent-run-aggregates-fixture'

describe('averageRun: la media que sostiene una estimacion', () => {
  it('sin historial devuelve null, no cero', () => {
    // Cero seria "sale gratis" y es una estimacion inventada. Null dice "no lo
    // se", que es lo unico cierto cuando no hay una sola corrida que promediar.
    expect(banco().agg.averageRun('p1')).toBeNull()
  })

  it('promedia coste y duracion, y la duracion sale en segundos', () => {
    const { db, agg } = banco()
    corrida(db, { costUsd: 2, durationMs: 10_000 })
    corrida(db, { costUsd: 4, durationMs: 20_000 })

    expect(agg.averageRun('p1')).toEqual({ usd: 3, seconds: 15 })
  })

  it('las corridas fallidas no entran en la media', () => {
    // Una que revento a los dos segundos no dice cuanto cuesta hacer el trabajo.
    const { db, agg } = banco()
    corrida(db, { costUsd: 6, durationMs: 30_000 })
    corrida(db, { costUsd: 0, durationMs: 2_000, failed: 1 })

    expect(agg.averageRun('p1')).toEqual({ usd: 6, seconds: 30 })
  })

  it('mira solo el proyecto que se le pide', () => {
    const { db, agg } = banco()
    corrida(db, { projectId: 'p1', costUsd: 1, durationMs: 1_000 })
    corrida(db, { projectId: 'p2', costUsd: 99, durationMs: 99_000 })

    expect(agg.averageRun('p1')?.usd).toBe(1)
  })
})

describe('episodeTallySince: cuantas corridas hubo y cuantas salieron mal', () => {
  it('sin corridas, ni episodios ni fallos', () => {
    expect(banco().agg.episodeTallySince(MEDIANOCHE)).toEqual({ episodes: 0, failures: 0 })
  })

  it('cuenta una corrida por episodio, de cualquier tipo y proyecto', () => {
    const { db, agg } = banco()
    corrida(db, { kind: 'chat' })
    corrida(db, { kind: 'repair', projectId: 'p2' })
    corrida(db, { kind: 'scan', failed: 1 })

    expect(agg.episodeTallySince(MEDIANOCHE)).toEqual({ episodes: 3, failures: 1 })
  })

  it('respeta la ventana igual que el gasto', () => {
    const { db, agg } = banco()
    corrida(db, { at: AYER, failed: 1 })
    corrida(db, {})

    expect(agg.episodeTallySince(MEDIANOCHE)).toEqual({ episodes: 1, failures: 0 })
  })
})
