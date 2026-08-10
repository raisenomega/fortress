import { describe, expect, it } from 'vitest'
import { gateQueue } from './gate-queue'

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

describe('gateQueue (D16: un gate a la vez)', () => {
  it('dos gates paralelos se SERIALIZAN y cada uno recibe su resultado', async () => {
    const orden: string[] = []

    const primero = gateQueue.enqueue(async () => {
      orden.push('a-empieza')
      await wait(50)
      orden.push('a-termina')
      return 'A'
    })
    const segundo = gateQueue.enqueue(async () => {
      orden.push('b-empieza')
      return 'B'
    })

    expect(await primero).toBe('A')
    expect(await segundo).toBe('B')
    expect(orden).toEqual(['a-empieza', 'a-termina', 'b-empieza'])
  })
})
