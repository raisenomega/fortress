import { describe, expect, it } from 'vitest'
import { decideReindex, STALE_MS } from './reindex-decision'

const HEAD = 'a'.repeat(40)
const FANTASMA = 'b'.repeat(40)
const decide = (over: Partial<Parameters<typeof decideReindex>[0]> = {}): string =>
  decideReindex({ currentSha: HEAD, indexedSha: HEAD, status: 'IDLE', now: 1000, ...over }).action

/**
 * BUG 4. El grafo se indexo SOBRE un `checkpoint transitorio` —el commit que el
 * turno crea y que `reset --soft` deshace al cerrar—, y el indice quedo
 * apuntando a un sha que ya no existe en la rama.
 *
 * Medido el 2026-09-19: `raisen-nucleo` con `indexado = 1752916` («checkpoint
 * transitorio», 05:19) mientras HEAD seguia en el commit del operador. El chip
 * decia «desactualizado» y ningun reconcile lo arreglaba solo.
 */
describe('con un turno vivo NO se indexa', () => {
  it('aunque HEAD haya cambiado: lo que se indexaria es efimero', () => {
    expect(decide({ indexedSha: FANTASMA, turnoVivo: true })).toBe('SKIP')
  })

  it('aunque NUNCA se haya indexado: esperar no cuesta, adelantarse si', () => {
    // Es el caso que mas invita a indexar «ya que estamos», y el peor: el
    // primer indice del proyecto quedaria clavado en un commit que se borra.
    expect(decide({ indexedSha: null, turnoVivo: true })).toBe('SKIP')
  })

  it('manda sobre RECLAIM_STALE: ni una corrida huerfana lo justifica', () => {
    const viejo = { status: 'RUNNING' as const, runningSince: 0, now: STALE_MS + 1 }

    expect(decide({ ...viejo, indexedSha: FANTASMA })).toBe('RECLAIM_STALE')
    expect(decide({ ...viejo, indexedSha: FANTASMA, turnoVivo: true })).toBe('SKIP')
  })

  it('y en cuanto el turno acaba, vuelve a decidir como siempre', () => {
    expect(decide({ indexedSha: FANTASMA, turnoVivo: false })).toBe('REINDEX')
  })
})

describe('un indice apuntando a un sha que ya no existe SE REPARA', () => {
  it('no se confunde con «alineado»: compara igualdad, no ascendencia', () => {
    // El fantasma no es un sha viejo que se quedo atras — es uno BORRADO. Por
    // eso basta comparar: nunca volvera a coincidir con HEAD.
    expect(decide({ indexedSha: FANTASMA })).toBe('REINDEX')
  })

  it('y con HEAD de verdad alineado sigue sin gastar una corrida', () => {
    expect(decide({ indexedSha: HEAD })).toBe('SKIP')
  })
})
