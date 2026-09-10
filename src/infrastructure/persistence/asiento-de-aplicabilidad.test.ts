import { describe, expect, it } from 'vitest'
import { asentarAplicabilidad } from '@application/scan/asentar-aplicabilidad'
import type { AppContext } from '@application/context'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import { createMemoryDb } from './memory-db'
import { createSqliteOmegaLog } from './sqlite-omega-log'

const PROYECTO = 'p1'

const banco = (): { context: AppContext; libro: () => readonly OmegaEntry[] } => {
  const omegaLog = createSqliteOmegaLog(createMemoryDb())
  return {
    context: { omegaLog } as unknown as AppContext,
    libro: () => omegaLog.listByProject(PROYECTO, 50)
  }
}

describe('el veredicto queda en el Libro, con clase propia', () => {
  it('kind aplicabilidad, y la cita en evidence', () => {
    const { context, libro } = banco()

    asentarAplicabilidad(context, PROYECTO, {
      modulo: 'M8',
      aplica: 'si',
      porque: 'src/pay/charge.ts:42'
    })

    expect(libro()[0].kind).toBe('aplicabilidad')
    expect(libro()[0].verdict).toBe('info')
    expect(libro()[0].evidence).toBe('src/pay/charge.ts:42')
    expect(libro()[0].summary).toContain('aplica=si')
  })

  it('un juicio SIN cita tambien se asienta, diciendo que no se uso', () => {
    const { context, libro } = banco()

    asentarAplicabilidad(context, PROYECTO, { modulo: 'M3', aplica: 'si', porque: 'me parece' })

    // No mueve el manifiesto, pero que lo intentara es un hecho, y el Libro es
    // donde los hechos no se pierden.
    expect(libro()[0].summary).toContain('sin cita comprobable')
  })

  it('es APPEND-ONLY: dos veredictos son dos asientos, no uno pisado', () => {
    const { context, libro } = banco()

    asentarAplicabilidad(context, PROYECTO, { modulo: 'M8', aplica: 'si', porque: 'a.ts:1' })
    asentarAplicabilidad(context, PROYECTO, { modulo: 'M3', aplica: 'no', porque: 'b.ts:2' })

    expect(libro()).toHaveLength(2)
  })
})
