import { describe, expect, it } from 'vitest'
import { decideReindex, STALE_MS } from './reindex-decision'

const NOW = 1_000_000_000
const base = { currentSha: 'aaa', indexedSha: 'aaa', status: 'IDLE' as const, now: NOW }

describe('decideReindex (matriz completa)', () => {
  it('nunca indexado -> REINDEX', () => {
    expect(decideReindex({ ...base, indexedSha: null }).action).toBe('REINDEX')
  })

  it('alineado e IDLE -> SKIP', () => {
    expect(decideReindex(base).action).toBe('SKIP')
  })

  it('RUNNING fresco -> SKIP, aunque el SHA difiera', () => {
    const d = decideReindex({ ...base, currentSha: 'bbb', status: 'RUNNING', runningSince: NOW - 1000 }) // prettier-ignore
    expect(d.action).toBe('SKIP')
  })

  it('RUNNING fresco con indexedSha null -> SKIP (el gate RUNNING gana)', () => {
    const d = decideReindex({ ...base, indexedSha: null, status: 'RUNNING', runningSince: NOW - 1000 }) // prettier-ignore
    expect(d.action).toBe('SKIP')
  })

  it('RUNNING huerfano (>= STALE_MS) -> RECLAIM_STALE', () => {
    const d = decideReindex({ ...base, status: 'RUNNING', runningSince: NOW - STALE_MS })
    expect(d.action).toBe('RECLAIM_STALE')
  })

  it('SHA distinto e IDLE -> REINDEX', () => {
    expect(decideReindex({ ...base, currentSha: 'bbb' }).action).toBe('REINDEX')
  })

  it('SHA distinto y ERROR -> REINDEX (se reintenta con HEAD nuevo)', () => {
    expect(decideReindex({ ...base, currentSha: 'bbb', status: 'ERROR' }).action).toBe('REINDEX')
  })

  it('SHA igual y ERROR -> SKIP: reintentar lo mismo daria lo mismo', () => {
    expect(decideReindex({ ...base, status: 'ERROR' }).action).toBe('SKIP')
  })

  it('toda decision lleva razon legible', () => {
    expect(decideReindex({ ...base, currentSha: 'bbb' }).reason).toMatch(/HEAD/)
    expect(decideReindex({ ...base, indexedSha: null }).reason).toMatch(/indexado/)
  })
})
