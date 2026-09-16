import { beforeEach, describe, expect, it } from 'vitest'
import type { SendMessageInput } from '@application/chat/send-message-types'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'
import { conLoteDelPlan } from './lote-del-plan'

// prettier-ignore
const envio: SendMessageInput = { projectId: 'p1', prompt: 'dame el plan', mode: 'supervisado', excludedAgents: [] }

describe('el turno de PLAN viaja con los ids del lote pendiente', () => {
  beforeEach(() => useColaDelLoteStore.getState().descartar())

  it('con un lote esperando aprobacion en ESE proyecto: los lleva', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1', 'f2'])

    expect(conLoteDelPlan(envio).lote).toEqual(['f1', 'f2'])
  })

  it('un turno con foco no se toca: el foco manda y sigue siendo UNO', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1'])

    expect(conLoteDelPlan({ ...envio, findingId: 'f9' }).lote).toBeUndefined()
  })

  it('si ya trae su lote (los turnos de la cola), se respeta', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1'])

    expect(conLoteDelPlan({ ...envio, lote: ['f7'] }).lote).toEqual(['f7'])
  })

  it('el lote de OTRO proyecto no viaja', () => {
    useColaDelLoteStore.getState().preparar('p2', ['f1'])

    expect(conLoteDelPlan(envio).lote).toBeUndefined()
  })

  it('sin lote pendiente, el envio sale exactamente igual', () => {
    expect(conLoteDelPlan(envio)).toEqual(envio)
  })
})
