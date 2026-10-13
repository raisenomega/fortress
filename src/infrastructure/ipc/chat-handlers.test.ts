import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { MensajeDeHilo } from '@domain/chat/chat-repository'

type Handler = (event: unknown, ...args: unknown[]) => unknown
const handlers = new Map<string, Handler>()
const filas: { chatId: string; mensaje: MensajeDeHilo }[] = []

vi.mock('electron', () => ({
  ipcMain: { handle: (canal: string, fn: Handler): void => void handlers.set(canal, fn) }
}))
vi.mock('../persistence/app-context', () => ({
  getAppContext: (): AppContext =>
    ({
      chat: {
        addToChat: (chatId: string, mensaje: MensajeDeHilo): MensajeDeHilo => {
          filas.push({ chatId, mensaje })
          return mensaje
        }
      }
    }) as unknown as AppContext
}))

const { IPC } = await import('./channels')
const { registerChatHandlers } = await import('./chat-handlers')
registerChatHandlers()

describe('chat:add-to-hilo tacha secretos en main antes de persistir', () => {
  it('un sk-ant- de usuario o asistente no llega a la fila', () => {
    const secreto = 'sk-ant-api03-' + 'a'.repeat(40)
    const add = handlers.get(IPC.chatAddToHilo)
    expect(add).toBeDefined()
    for (const role of ['user', 'assistant'] as const) {
      const mensaje = { role, content: `mira ${secreto} aqui` } as unknown as MensajeDeHilo
      add?.({}, 'h1', mensaje)
    }
    expect(filas).toHaveLength(2)
    for (const { chatId, mensaje } of filas) {
      expect(chatId).toBe('h1')
      expect(mensaje.content).not.toContain(secreto)
      expect(mensaje.content).toContain('mira')
    }
    expect(filas.map((f) => f.mensaje.role)).toEqual(['user', 'assistant'])
  })
})
