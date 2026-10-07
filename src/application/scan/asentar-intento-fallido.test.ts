import { describe, expect, it, vi } from 'vitest'
import type { IntentoFallido } from '@domain/scan/intento-fallido'
import type { AppContext } from '../context'
import { asentarIntentoFallido } from './asentar-intento-fallido'

function contexto(): { context: AppContext; record: ReturnType<typeof vi.fn> } {
  const record = vi.fn()
  const context = {
    transaction: (work: () => void) => work(),
    runs: { record },
    selfObservations: { add: vi.fn() }
  } as unknown as AppContext
  return { context, record }
}

// prettier-ignore
const INTENTO: IntentoFallido = {
  projectId: 'p1', motivo: 'proceso', durationMs: 5,
  usage: { inputTokens: 1, outputTokens: 2, cacheReadTokens: 0, cacheCreationTokens: 0, costUsd: 0.1, numTurns: 3 },
  tools: [], texto: '', notas: []
}

describe('el intento fallido asienta el modelo que corrio', () => {
  it('con modelo, la fila lo lleva', () => {
    const { context, record } = contexto()

    asentarIntentoFallido(context, { ...INTENTO, modelo: 'claude-opus-4-8' })

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'scan', failed: true, modelo: 'claude-opus-4-8' })
    )
  })

  it('candado: sin modelo, la fila va SIN la clave — null honesto, no un invento', () => {
    const { context, record } = contexto()

    asentarIntentoFallido(context, INTENTO)

    expect(record.mock.calls[0][0]).not.toHaveProperty('modelo')
  })
})
