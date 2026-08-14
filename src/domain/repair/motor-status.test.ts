import { describe, expect, it } from 'vitest'
import { CONTAMINADO, reduceMotorStatus } from './motor-status'
import type { Proposal, ProposalState } from './proposal'

const p = (id: string, state: ProposalState): Proposal =>
  ({ id, projectId: 'proj', findingId: 'f', baseSha: 'b', state, createdAt: 1, updatedAt: 1 }) as Proposal // prettier-ignore

const reduce = (states: ProposalState[], sucio = false): ReturnType<typeof reduceMotorStatus> =>
  reduceMotorStatus(
    states.map((s, i) => p(`p-${i}`, s)),
    sucio
  )

describe('reduceMotorStatus: la contaminacion gana a todo', () => {
  it('proyecto contaminado y sin propuestas: sigue detenido', () => {
    expect(reduce([], true)).toEqual({ kind: 'stopped-critical', reason: CONTAMINADO })
  })

  it('proyecto contaminado con una propuesta esperando: manda el bloqueo', () => {
    // Atenderla no serviria de nada: guardRun no dejaria correr nada despues.
    expect(reduce(['OMEGA'], true)).toMatchObject({ kind: 'stopped-critical' })
  })
})

describe('reduceMotorStatus: toda propuesta viva espera a una persona', () => {
  it('sin propuestas: nada pendiente', () => {
    expect(reduce([])).toEqual({ kind: 'clean' })
  })

  it('solo propuestas terminales: nada pendiente', () => {
    expect(reduce(['MERGEADO', 'RECHAZADO', 'CADUCADO'])).toEqual({ kind: 'clean' })
  })

  it('una recien analizada cuenta: lleva parada desde que se analizo', () => {
    // El motor no la esta trabajando. Espera a que el operador pulse Generar,
    // y llamar a eso "procesando" escondia lo unico que habia que hacer.
    expect(reduce(['ANALIZADO'])).toEqual({ kind: 'awaiting-review', count: 1 })
  })

  it('una en OMEGA cuenta igual: firma humana pendiente', () => {
    expect(reduce(['OMEGA'])).toEqual({ kind: 'awaiting-review', count: 1 })
  })

  it('cuenta las vivas y solo las vivas', () => {
    expect(reduce(['ELEGIDO', 'GATE', 'OMEGA', 'MERGEADO', 'CADUCADO'])).toMatchObject({ count: 3 })
  })

  it('lo vivo sale de la tabla de transiciones, no de una lista propia', () => {
    // Ningun estado esta nombrado en el reductor: si manana se anade una fase
    // no terminal, cuenta sola.
    expect(reduce(['GENERADO'])).toMatchObject({ kind: 'awaiting-review' })
  })
})
