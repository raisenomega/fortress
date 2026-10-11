import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Finding } from '../project/finding'
import type { OmegaEntry } from '../omega/omega-entry'
import { bloqueCtoKit } from './bloque-cto-kit'
import { marcoDeHallazgos, marcoDeHistoria, marcoDelLibroDeVida } from './marcos-del-libro'
import { marcoDeCognicion, marcoDeReparaciones } from './marcos-del-motor'
import type { Proposal } from '../repair/proposal'
import type { ProposalEvent } from '../repair/proposal-event'

const vivo = (title: string): Finding =>
  ({ id: 'f1', severity: 'HIGH', title, file: 'a.ts', line: 3 }) as Finding

const asiento = (summary: string): OmegaEntry =>
  ({ at: '2026-10-09', kind: 'nota', verdict: 'info', summary }) as OmegaEntry

describe('los marcos resumen una linea por hecho, con tope', () => {
  it('hallazgos: severidad · ancla · titulo, y el total delante', () => {
    const m = marcoDeHallazgos([vivo('clave expuesta')])
    expect(m.texto).toContain('1 sin extinguir (muestra 1):')
    expect(m.texto).toContain('HIGH · a.ts:3 · clave expuesta')
  })

  it('hallazgos: el resto (no grave) se topa en 40; el total va delante', () => {
    const leve = (title: string): Finding => ({ ...vivo(title), severity: 'LOW' }) as Finding
    const m = marcoDeHallazgos(Array.from({ length: 45 }, (_, i) => leve(`t${i}`)))
    expect(m.texto).toContain('45 sin extinguir (muestra 40):')
    expect(m.texto).not.toContain('t40')
  })

  it('omega: fecha · kind · verdict · summary', () => {
    expect(marcoDelLibroDeVida([asiento('juicio ok')]).texto).toBe(
      '2026-10-09 · nota · info · juicio ok'
    )
  })

  it('reparaciones: estado, hallazgo y hasta donde llego la cadena', () => {
    const p = { state: 'ELEGIDO', findingId: 'h9' } as Proposal
    const e = { phase: 'SELECT' } as ProposalEvent
    expect(marcoDeReparaciones([{ propuesta: p, eventos: [e] }]).texto).toBe(
      'ELEGIDO · hallazgo h9 · 1 asientos, ultimo SELECT'
    )
  })

  it('cognicion: solo ACTIVE, y sin log no hay lineas', () => {
    const patron = { id: 'PTN-1', title: 'x', status: 'ACTIVE', severity: null } as never
    const con = { present: true, generation: 1, patterns: [patron], attention: [], reflections: [] } // prettier-ignore
    expect(marcoDeCognicion(con).texto).toBe('PTN-1 · x')
    expect(marcoDeCognicion({ ...con, present: false }).texto).toBe('')
  })
})

describe('la fuente vacia cae SOLA en el bloque, sin cabecera huerfana', () => {
  it('historia vacia no aparece; la llena si', () => {
    const bloque = bloqueCtoKit([marcoDeHistoria([]), marcoDeHallazgos([vivo('solo este')])])
    expect(bloque).not.toContain('historia-reciente')
    expect(bloque).toContain('=== MARCO: hallazgos-vivos ===')
  })
})

describe('DOMINIO PURO: los compositores no tocan disco ni base', () => {
  it('ni fs ni electron ni better-sqlite3 en los dos modulos', () => {
    for (const f of [
      'src/domain/build/marcos-del-libro.ts',
      'src/domain/build/marcos-del-motor.ts'
    ])
      expect(readFileSync(f, 'utf8')).not.toMatch(/from '(node:)?fs'|electron|better-sqlite3/)
  })
})
