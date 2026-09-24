import { describe, expect, it } from 'vitest'
import { decideReindex } from './reindex-decision'

const NOW = 1_000_000_000
const base = { currentSha: 'aaa', indexedSha: 'aaa', status: 'IDLE' as const, now: NOW }

describe('decideReindex: el indice tiene que existir en disco, no solo en la contabilidad', () => {
  it('sha alineado pero SIN indice en disco -> REINDEX (mailbd: la cache renacio y nadie lo vio)', () => {
    const d = decideReindex({ ...base, indiceEnDisco: false })
    expect(d.action).toBe('REINDEX')
    expect(d.reason).toContain('indice ausente')
  })

  it('sha alineado y CON indice en disco -> SKIP, como siempre', () => {
    expect(decideReindex({ ...base, indiceEnDisco: true }).action).toBe('SKIP')
  })

  it('sin el dato (llamador viejo) -> la matriz de antes, sin cambios', () => {
    expect(decideReindex(base).action).toBe('SKIP')
  })

  it('el indice ausente NO pasa por encima de un turno vivo ni de una corrida fresca', () => {
    expect(decideReindex({ ...base, indiceEnDisco: false, turnoVivo: true }).action).toBe('SKIP')
    expect(decideReindex({ ...base, indiceEnDisco: false, status: 'RUNNING', runningSince: NOW - 1000 }).action).toBe('SKIP') // prettier-ignore
  })
})
