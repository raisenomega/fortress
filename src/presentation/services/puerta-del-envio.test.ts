import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SendMessageInput } from '@application/chat/send-message-types'
import { useWorkflowStore } from '../stores/workflow-store'

/** Lo que salio por el canal del Terminal, tal cual. */
const { enviados } = vi.hoisted(() => ({ enviados: [] as SendMessageInput[] }))

vi.mock('./chat-service', () => ({
  sendMessage: (input: SendMessageInput): Promise<void> => {
    enviados.push(input)
    return Promise.resolve()
  }
}))

const { aprobar, cancelar, enviar } = await import('./puerta-del-envio')

const SUPERVISADO = { projectId: 'p1', mode: 'supervisado' as const, excludedAgents: [] }
const AUTONOMO = { ...SUPERVISADO, mode: 'autonomo' as const }
const fijarFoco = (projectId = 'p1'): void =>
  useWorkflowStore.getState().setFoco({ projectId, findingId: 'f1' })

beforeEach(() => {
  enviados.length = 0
  useWorkflowStore.setState({ pendingPrompt: null, draft: '', foco: null })
})

describe('el foco sobrevive a la espera de aprobacion (supervisado)', () => {
  it('al enviar queda pendiente, sin salir, y el foco sigue puesto', () => {
    fijarFoco()
    enviar(SUPERVISADO, 'Resuelve este hallazgo', false)

    expect(enviados).toHaveLength(0)
    expect(useWorkflowStore.getState().pendingPrompt).toBe('Resuelve este hallazgo')
    expect(useWorkflowStore.getState().foco).toEqual({ projectId: 'p1', findingId: 'f1' })
  })

  it('al Aprobar, el envio sale con su findingId', () => {
    fijarFoco()
    enviar(SUPERVISADO, 'Resuelve este hallazgo', false)
    aprobar(SUPERVISADO)

    expect(enviados).toHaveLength(1)
    expect(enviados[0]).toMatchObject({ prompt: 'Resuelve este hallazgo', findingId: 'f1' })
  })
})

describe('tras enviar, el foco se limpia', () => {
  it('un segundo mensaje, ya sin hallazgo, NO lleva findingId', () => {
    fijarFoco()
    enviar(AUTONOMO, 'Resuelve este hallazgo', false)
    enviar(AUTONOMO, 'y ahora una pregunta libre', false)

    expect(enviados[0].findingId).toBe('f1')
    expect(enviados[1]).not.toHaveProperty('findingId')
    expect(useWorkflowStore.getState().foco).toBeNull()
  })

  it('cancelar descarta el mensaje y su foco: nada lo arrastra despues', () => {
    fijarFoco()
    enviar(SUPERVISADO, 'Resuelve este hallazgo', false)
    cancelar()
    enviar(AUTONOMO, 'otra cosa', false)

    expect(enviados).toHaveLength(1)
    expect(enviados[0]).not.toHaveProperty('findingId')
  })

  it('un foco de OTRO proyecto no viaja con el envio de este', () => {
    fijarFoco('p-otro')
    enviar(AUTONOMO, 'hola', false)

    expect(enviados[0]).not.toHaveProperty('findingId')
  })
})
