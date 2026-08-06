import { describe, expect, it } from 'vitest'
import { sendMessage } from './send-message'
import { assistantOf, fakeContext, input, never, NO_CLI, noop } from './chat-test-fixtures'

describe('sendMessage', () => {
  it('rechaza si el proyecto ya no existe', async () => {
    const { context, added } = fakeContext(null)
    const r = await sendMessage(context, assistantOf('x'), NO_CLI, input(), noop, noop, never)
    expect(r.ok).toBe(false)
    expect(added).toHaveLength(0)
  })

  it('sin CLI ni API no persiste nada: lo que no prospera no ensucia el historial', async () => {
    const { context, added } = fakeContext()
    const r = await sendMessage(context, null, NO_CLI, input(), noop, noop, never)
    expect(r.ok).toBe(false)
    expect(added).toHaveLength(0)
  })

  it('camino API: persiste usuario y respuesta EN ORDEN y devuelve el motor', async () => {
    const { context, added } = fakeContext()
    const r = await sendMessage(
      context,
      assistantOf('respuesta'),
      NO_CLI,
      input(),
      noop,
      noop,
      never
    )
    expect(r.ok && r.value.engine).toBe('api')
    expect(added.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(added[1].content).toBe('respuesta')
  })
})
