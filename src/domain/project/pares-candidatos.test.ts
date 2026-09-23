import { describe, expect, it } from 'vitest'
import { paresCandidatos, type FilaDelPar } from './pares-candidatos'

// prettier-ignore
const fila = (id: string, o: Partial<FilaDelPar> = {}): FilaDelPar => ({ id, file: 'f/index.ts', line: 10, tipo: 'rate-limit-ausente', simbolo: 'handler', title: `t-${id}`, identity: `f/index.ts|10|rate-limit-ausente`, firstSeen: '2026-09-01', severity: 'LOW', ...o })

describe('paresCandidatos: solo misma sede o misma linea, dentro del mismo fichero (ADR-101 §5)', () => {
  it('misma sede (fichero y simbolo) en lineas distintas es candidato; el par se nombra por ids ordenados', () => {
    const pares = paresCandidatos([fila('b', { line: 20 }), fila('a')])
    expect(pares.map((p) => p.id)).toEqual(['a+b'])
    expect(pares[0]?.a.id).toBe('a')
  })

  it('misma linea con simbolos distintos tambien; y un par no se cuenta dos veces', () => {
    expect(
      paresCandidatos([fila('a', { simbolo: 'x' }), fila('b', { simbolo: 'y', tipo: 'otro' })])
    ).toHaveLength(1)
    expect(paresCandidatos([fila('a'), fila('b', { tipo: 'otro' })])).toHaveLength(1)
  })

  it('no alcanza a filas de otro fichero, ni a las de otro simbolo en otra linea, ni sin simbolo lejos', () => {
    expect(paresCandidatos([fila('a'), fila('b', { file: 'g/index.ts' })])).toEqual([])
    expect(paresCandidatos([fila('a'), fila('b', { simbolo: 'other', line: 99 })])).toEqual([])
    expect(
      paresCandidatos([fila('a', { simbolo: null }), fila('b', { simbolo: null, line: 11 })])
    ).toEqual([])
  })
})
