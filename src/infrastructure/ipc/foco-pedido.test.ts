import { describe, expect, it } from 'vitest'
import type { SendMessageInput } from '@application/chat/send-message-types'
import { conFocoSaneado, focoPedido } from './foco-pedido'

const envio: SendMessageInput = {
  projectId: 'p1',
  prompt: 'resuelvelo',
  mode: 'autonomo',
  excludedAgents: []
}

describe('el findingId que llega del renderer se sanea en la puerta', () => {
  it('una cadena con espacios se recorta', () => {
    expect(focoPedido('  f1  ')).toBe('f1')
  })

  it('vacia, en blanco o de otro tipo no es un foco: nada', () => {
    for (const crudo of ['', '   ', 42, null, undefined, { id: 'f1' }]) {
      expect(focoPedido(crudo)).toBeUndefined()
    }
  })

  it('el envio conserva todo lo demas y lleva su foco limpio', () => {
    expect(conFocoSaneado({ ...envio, findingId: ' f1 ' })).toEqual({ ...envio, findingId: 'f1' })
  })

  it('sin foco, el envio sale como siempre', () => {
    const saneado = conFocoSaneado(envio)

    expect(saneado.findingId).toBeUndefined()
    expect(saneado).toEqual(envio)
  })
})
