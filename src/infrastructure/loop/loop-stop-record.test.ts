import { describe, expect, it } from 'vitest'
import type { StopFacts } from '@domain/loop/stop-detail'
import { paradaLimpia, paradaPorFallo } from './loop-stop-record'
import { LoopCancelled, LoopTerminal } from './loop-standby'

const HECHOS: StopFacts = {
  spentSession: 5,
  costCap: 5,
  cyclesDone: 1,
  maxCycles: 8,
  maxConsecutiveDenials: 5,
  maxConsecutiveNoCandidates: 10
}

describe('parada: de como termino el ciclo a lo que se guarda', () => {
  it('el motivo llega con su cifra y con el momento en que paro', () => {
    const parada = paradaLimpia('tope-gasto', HECHOS)
    expect(parada.stoppedReason).toBe('tope-gasto')
    expect(parada.stoppedReasonDetail).toBe('$5.00 de $5.00')
    expect(Number.isNaN(Date.parse(parada.stoppedAt))).toBe(false)
  })

  it('un motivo sin cifra no inventa una', () => {
    expect(paradaLimpia('detenido', HECHOS).stoppedReasonDetail).toBeUndefined()
  })
})

describe('parada por excepcion: cancelar no es lo mismo que romperse', () => {
  it('cancelar es una parada limpia y pedida', () => {
    const parada = paradaPorFallo(new LoopCancelled())
    expect(parada.stoppedReason).toBe('detenido')
    expect(parada.stoppedReasonDetail).toBeUndefined()
  })

  it('un fallo terminal es un error, y su mensaje es el detalle', () => {
    const parada = paradaPorFallo(new LoopTerminal('credito agotado'))
    expect(parada.stoppedReason).toBe('error')
    expect(parada.stoppedReasonDetail).toBe('credito agotado')
  })

  it('lo lanzado no siempre es un Error, y aun asi hay que poder contarlo', () => {
    expect(paradaPorFallo('algo raro')).toMatchObject({
      stoppedReason: 'error',
      stoppedReasonDetail: 'algo raro'
    })
  })
})
