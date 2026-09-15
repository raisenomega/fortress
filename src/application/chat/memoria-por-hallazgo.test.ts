import { describe, expect, it } from 'vitest'
import type { AppContext } from '../context'
import type { TurnoProtegido } from './con-red-de-reversion'
import { recordarSesion } from './memoria-por-hallazgo'
import { textOnly, type ReplyOutcome } from './reply-outcome'

function banco(): { context: AppContext; recordadas: string[]; olvidadas: string[] } {
  const recordadas: string[] = []
  const olvidadas: string[] = []
  const findings = {
    recordarSesionDelTerminal: (id: string, s: string) => void recordadas.push(`${id}:${s}`),
    olvidarSesionDelTerminal: (id: string) => void olvidadas.push(id)
  }
  return { context: { findings } as unknown as AppContext, recordadas, olvidadas }
}

// prettier-ignore
const turno = (red: Pick<TurnoProtegido, 'conservado' | 'revertido'>, outcome: Partial<ReplyOutcome> = { sesion: 'ses-2' }): TurnoProtegido =>
  ({ outcome: { ...textOnly('hecho'), ...outcome }, aviso: '', ...red })

const REVIRTIO = { conservado: false, revertido: true }
const CONSERVO = { conservado: true, revertido: false }
const SIN_RED = { conservado: false, revertido: false }

describe('GARANTIA 1: la sesion NO avanza SOLO cuando la red REVIRTIO', () => {
  it('(i) la red revirtio: NO avanza, el arbol ya no tiene lo que recordaria', () => {
    const b = banco()
    recordarSesion(b.context, 'f1', turno(REVIRTIO))
    expect(b.recordadas).toEqual([])
  })

  it('(ii) la red conservo el turno: avanza', () => {
    const b = banco()
    recordarSesion(b.context, 'f1', turno(CONSERVO))
    expect(b.recordadas).toEqual(['f1:ses-2'])
  })

  it('(iii) sin red —un «propon» en supervisado—: avanza, aunque no haya conservado', () => {
    // Justo el caso que `conservado` a secas perderia: false, y aun asi avanza.
    const b = banco()
    recordarSesion(b.context, 'f1', turno(SIN_RED))
    expect(b.recordadas).toEqual(['f1:ses-2'])
  })
})

describe('sin foco o sin sesion no se escribe nada; la rota se olvida siempre', () => {
  it('sin foco, ni con sesion en la respuesta', () => {
    const b = banco()
    recordarSesion(b.context, null, turno(CONSERVO))
    expect([b.recordadas, b.olvidadas]).toEqual([[], []])
  })

  it('sin sesion en la respuesta, nada inventado', () => {
    const b = banco()
    recordarSesion(b.context, 'f1', turno(CONSERVO, {}))
    expect(b.recordadas).toEqual([])
  })

  it('GARANTIA 2: la rota se olvida y la nueva se recuerda', () => {
    const b = banco()
    recordarSesion(b.context, 'f1', turno(CONSERVO, { sesion: 'ses-nueva', sesionRota: true }))
    expect([b.olvidadas, b.recordadas]).toEqual([['f1'], ['f1:ses-nueva']])
  })

  it('la rota se olvida AUNQUE la red revirtiera el turno', () => {
    const b = banco()
    recordarSesion(b.context, 'f1', turno(REVIRTIO, { sesion: 'ses-nueva', sesionRota: true }))
    expect([b.olvidadas, b.recordadas]).toEqual([['f1'], []])
  })
})
