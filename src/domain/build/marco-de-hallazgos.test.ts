import { describe, expect, it } from 'vitest'
import type { Finding } from '../project/finding'
import { marcoDeHallazgos } from './marcos-del-libro'

/** PASO 159 (B.3): el marco de hallazgos del CTO marca el estado (honestidad),
 *  no ciega de lo grave y añade campos. El Finding completo ya llega. */

const f = (over: Partial<Finding> = {}): Finding =>
  ({
    id: 'x',
    severity: 'HIGH',
    title: 't',
    file: 'a.ts',
    line: 1,
    status: 'open',
    lifecycle: 'ACTIVE',
    mitigatedNote: null,
    verificacionNote: null,
    lastSeen: '2026-09-01T00:00:00Z',
    ...over
  }) as Finding

const lineaCon = (texto: string, token: string): string =>
  texto.split('\n').find((l) => l.includes(token)) ?? ''

describe('marcoDeHallazgos: honestidad de estado (B.3)', () => {
  it('T1: el descartado y el mitigado van MARCADOS; el abierto-activo, sin marca', () => {
    const texto = marcoDeHallazgos([
      f({ id: 'a', title: 'tituloA' }),
      f({ id: 'b', title: 'tituloB', status: 'false_positive' }),
      f({ id: 'c', title: 'tituloC', lifecycle: 'MITIGATED' })
    ]).texto
    expect(lineaCon(texto, 'tituloB')).toContain('DESCARTADO')
    expect(lineaCon(texto, 'tituloC')).toContain('MITIGADO')
    expect(lineaCon(texto, 'tituloA')).not.toMatch(/DESCARTADO|MITIGADO/)
  })

  it('T2: con N>tope, NINGÚN CRITICAL/HIGH se pierde y la cabecera dice el total', () => {
    const graves = Array.from({ length: 5 }, (_, i) =>
      f({ id: `g${i}`, severity: 'CRITICAL', title: `grave${i}` })
    )
    const leves = Array.from({ length: 60 }, (_, i) =>
      f({ id: `l${i}`, severity: 'LOW', title: `leve${i}` })
    )
    // Los graves AL FINAL a propósito: la selección debe conservarlos igual.
    const texto = marcoDeHallazgos([...leves, ...graves]).texto
    for (let i = 0; i < 5; i += 1) expect(texto).toContain(`grave${i}`)
    expect(texto.split('\n')[0]).toContain('65')
  })

  it('T3: cada línea lleva severity·file:line·title y, si hay, la nota', () => {
    const texto = marcoDeHallazgos([
      f({ title: 'conNota', lifecycle: 'MITIGATED', mitigatedNote: 'parchado en el guard' })
    ]).texto
    expect(texto).toContain('HIGH · a.ts:1 · conNota')
    expect(texto).toContain('MITIGADO')
    expect(texto).toContain('parchado en el guard')
  })

  it('vivos vacío → texto vacío (la cabecera no queda huérfana)', () => {
    expect(marcoDeHallazgos([]).texto).toBe('')
  })
})
