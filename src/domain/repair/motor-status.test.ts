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

  it('proyecto contaminado con una propuesta esperando firma: manda el bloqueo', () => {
    // Firmar no serviria de nada: guardRun no dejaria correr nada despues.
    expect(reduce(['OMEGA'], true)).toMatchObject({ kind: 'stopped-critical' })
  })
})

describe('reduceMotorStatus: manda lo que pide accion del operador', () => {
  it('sin propuestas: nada pendiente', () => {
    expect(reduce([])).toEqual({ kind: 'clean' })
  })

  it('solo propuestas terminales: nada pendiente', () => {
    expect(reduce(['MERGEADO', 'RECHAZADO', 'CADUCADO'])).toEqual({ kind: 'clean' })
  })

  it('una en OMEGA: espera firma', () => {
    expect(reduce(['OMEGA'])).toEqual({ kind: 'awaiting-review', count: 1 })
  })

  it('cuenta las que esperan, no las vivas', () => {
    expect(reduce(['OMEGA', 'APROBADO', 'GATE', 'MERGEADO'])).toMatchObject({ count: 2 })
  })

  it('una corriendo y otra esperando: gana la que espera', () => {
    // Decir "procesando" aqui esconderia la unica que pedia algo del operador.
    expect(reduce(['GATE', 'OMEGA'])).toEqual({ kind: 'awaiting-review', count: 1 })
  })

  it('solo trabajo en curso: procesando, con la propuesta que lo ocupa', () => {
    expect(reduce(['GATE'])).toEqual({ kind: 'processing', proposalId: 'p-0' })
  })

  it('las fases activas se deducen por resta, no por lista', () => {
    // ELEGIDO no aparece nombrado en el reductor y aun asi cuenta como vivo.
    expect(reduce(['ELEGIDO'])).toMatchObject({ kind: 'processing' })
  })
})
