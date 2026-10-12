import { describe, expect, it } from 'vitest'
import type { Candidate } from './select-target'
import { ordenarCola } from './orden-de-la-cola'

const c = (id: string, severity: Candidate['severity']): Candidate => ({
  id,
  severity,
  title: id,
  file: `src/${id}.ts`,
  line: 1,
  firstSeen: '2026-01-01T00:00:00.000Z',
  tipo: null,
  simbolo: null
})

describe('ordenarCola: la cola del lazo, severidad-primero (ATERRIZAJE-1)', () => {
  it('ordena CRITICAL < HIGH < MEDIUM < LOW, pase cual sea el orden de entrada', () => {
    const entrada = [c('low', 'LOW'), c('crit', 'CRITICAL'), c('med', 'MEDIUM'), c('high', 'HIGH')]
    expect(ordenarCola(entrada)).toEqual(['crit', 'high', 'med', 'low'])
  })

  it('cola vacia -> []', () => {
    expect(ordenarCola([])).toEqual([])
  })

  it('MUTANTE: ignorar la severidad -> el CRITICAL ya no saldria primero', () => {
    const entrada = [c('a', 'LOW'), c('b', 'LOW'), c('z', 'CRITICAL')]
    expect(ordenarCola(entrada)[0]).toBe('z') // CRITICAL primero pese a entrar ultimo
  })

  it('saca TODOS (no se queda en la cabeza)', () => {
    const entrada = [c('crit', 'CRITICAL'), c('high', 'HIGH')]
    expect(ordenarCola(entrada)).toHaveLength(2)
  })
})
