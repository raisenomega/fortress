import { describe, expect, it } from 'vitest'
import { decideReindex, STALE_MS } from './reindex-decision'

const NOW = 1_000_000_000
const base = { currentSha: 'aaa', indexedSha: 'aaa', status: 'IDLE' as const, now: NOW }

describe('en el arranque, un indexado RUNNING es huerfano por definicion', () => {
  it('ARRANQUE con RUNNING fresco -> RECLAIM: nada sobrevivio al proceso', () => {
    // El caso que colgo el grafo: la instancia anterior marco RUNNING, se cerro
    // y la siguiente respeto una corrida que ya no existia durante 15 minutos.
    const d = decideReindex({
      ...base,
      status: 'RUNNING',
      runningSince: NOW - 25_000,
      onBoot: true
    })
    expect(d.action).toBe('RECLAIM_STALE')
    expect(d.reason).toMatch(/arranque/)
  })

  it('FUERA del arranque, el mismo RUNNING fresco sigue en SKIP', () => {
    // No-regresion: en pleno vuelo esa marca puede ser una corrida viva de esta
    // instancia, y reclamarla lanzaria un segundo indexado sobre el mismo repo.
    const d = decideReindex({ ...base, status: 'RUNNING', runningSince: NOW - 25_000 })
    expect(d.action).toBe('SKIP')
  })

  it('RUNNING viejo -> RECLAIM con y sin arranque: STALE_MS sigue intacto', () => {
    const viejo = { ...base, status: 'RUNNING' as const, runningSince: NOW - STALE_MS }
    expect(decideReindex(viejo).action).toBe('RECLAIM_STALE')
    expect(decideReindex({ ...viejo, onBoot: true }).action).toBe('RECLAIM_STALE')
  })

  it('el arranque no altera nada que no sea RUNNING', () => {
    const arranque = { ...base, onBoot: true }
    expect(decideReindex({ ...arranque, indexedSha: null }).action).toBe('REINDEX')
    expect(decideReindex(arranque).action).toBe('SKIP')
    expect(decideReindex({ ...arranque, currentSha: 'bbb' }).action).toBe('REINDEX')
    expect(decideReindex({ ...arranque, status: 'ERROR' }).action).toBe('SKIP')
  })
})
