import { describe, expect, it } from 'vitest'
import { loopStop } from './loop-decision'
import { ESTADO_BASE as base } from './loop-decision-fixture'

describe('loopStop', () => {
  it('sigue cuando no se cumple ninguna parada', () => {
    expect(loopStop(base)).toBeNull()
  })

  it('la intervencion humana manda sobre todo, incluso si esta resuelto', () => {
    expect(loopStop({ ...base, cancelled: true, recentScores: [100, 100, 100] })).toBe('detenido')
  })

  it('para al alcanzar el tope de gasto', () => {
    expect(loopStop({ ...base, spentSession: 30 })).toBe('tope-gasto')
  })

  it('el gasto manda sobre el tope de ciclos', () => {
    expect(loopStop({ ...base, spentSession: 31, cyclesDone: 9 })).toBe('tope-gasto')
  })

  it('para al alcanzar el maximo de ciclos', () => {
    expect(loopStop({ ...base, cyclesDone: 5 })).toBe('tope-ciclos')
  })

  it('para al alcanzar la racha de denegaciones', () => {
    expect(loopStop({ ...base, consecutiveDenials: 5 })).toBe('tope-denegaciones')
  })

  it('para cuando la baraja se agota', () => {
    expect(loopStop({ ...base, consecutiveNoCandidates: 10 })).toBe('pool-agotado')
  })

  it('estar resuelto manda sobre la racha: el arco cerrado no es un desencaje', () => {
    const cerrado = { ...base, consecutiveDenials: 9, recentScores: [100, 100, 100] }
    expect(loopStop(cerrado)).toBe('resuelto')
  })

  it('para con 3 escaneos 100 seguidos', () => {
    expect(loopStop({ ...base, recentScores: [100, 100, 100] })).toBe('resuelto')
  })

  it('NO para si los 100 no son 3 seguidos', () => {
    expect(loopStop({ ...base, recentScores: [100, 100, 98, 100] })).toBeNull()
  })

  it('NO para con menos de 3 escaneos aunque sean 100', () => {
    expect(loopStop({ ...base, recentScores: [100, 100] })).toBeNull()
  })
})
