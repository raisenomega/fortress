import { describe, expect, it } from 'vitest'
import { createReindexQueue } from './reindex-queue'

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

describe('createReindexQueue', () => {
  it('dos trabajos paralelos se SERIALIZAN: el segundo espera al primero', async () => {
    const queue = createReindexQueue()
    const orden: string[] = []

    const primero = queue.enqueue(async () => {
      orden.push('a-empieza')
      await wait(50)
      orden.push('a-termina')
    })
    const segundo = queue.enqueue(async () => {
      orden.push('b-empieza')
    })

    await Promise.all([primero, segundo])
    expect(orden).toEqual(['a-empieza', 'a-termina', 'b-empieza'])
  })

  it('un trabajo que FALLA no bloquea a los siguientes', async () => {
    const queue = createReindexQueue()
    const orden: string[] = []

    const roto = queue.enqueue(async () => {
      throw new Error('kaput')
    })
    const siguiente = queue.enqueue(async () => {
      orden.push('sigue-vivo')
    })

    await expect(roto).rejects.toThrow('kaput')
    await siguiente
    expect(orden).toEqual(['sigue-vivo'])
  })
})
