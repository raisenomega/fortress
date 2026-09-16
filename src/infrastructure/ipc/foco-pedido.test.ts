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

describe('el lote que llega del renderer se sanea igual (ADR-088, arco 1)', () => {
  it('quita vacios y repetidos, y conserva el orden', () => {
    const saneado = conFocoSaneado({ ...envio, lote: ['f1', '', 'f2', 'f1'] })

    expect(saneado.lote).toEqual(['f1', 'f2'])
  })

  it('lo que no es lista no es lote, y sin lote la llave ni aparece', () => {
    expect(conFocoSaneado({ ...envio, lote: 'f1' as unknown as string[] }).lote).toBeUndefined()
    expect('lote' in conFocoSaneado(envio)).toBe(false)
  })

  it('el foco y el lote viajan juntos sin pisarse: el foco sigue siendo UNO', () => {
    const saneado = conFocoSaneado({ ...envio, findingId: 'f1', lote: ['f1', 'f2'] })

    expect(saneado.findingId).toBe('f1')
    expect(saneado.lote).toEqual(['f1', 'f2'])
  })
})
