import { beforeEach, describe, expect, it } from 'vitest'
import { asentarIntentoFallido } from '@application/scan/asentar-intento-fallido'
import type { IntentoFallido } from '@domain/scan/intento-fallido'
import { crearBench, PROYECTO, type Bench } from './cierre-partido-fixture'

const FACTURA = {
  inputTokens: 112,
  outputTokens: 49_629,
  cacheReadTokens: 5_976_485,
  cacheCreationTokens: 204_460,
  costUsd: 15.32,
  numTurns: 65
}

const INTENTO: IntentoFallido = {
  projectId: PROYECTO,
  motivo: 'informe-ilegible',
  durationMs: 900_000,
  usage: FACTURA,
  tools: ['Read'],
  texto: 'un muro de analisis sin bloque'
}

let bench: Bench

const corridas = (): Record<string, unknown>[] =>
  bench.db.prepare('SELECT failed, cost_usd, duration_ms, kind FROM agent_runs').all() as Record<string, unknown>[] // prettier-ignore

beforeEach(() => {
  bench = crearBench()
})

describe('un intento fallido deja su factura — la brecha de Health Flow', () => {
  it('asienta failed:true con el gasto real, no en silencio', () => {
    asentarIntentoFallido(bench.context, INTENTO)

    const [fila] = corridas()
    expect(fila.failed).toBe(1)
    expect(fila.cost_usd).toBe(15.32)
    expect(fila.duration_ms).toBe(900_000)
    expect(fila.kind).toBe('scan')
  })

  it('el proyecto tiene una corrida aunque NO tenga escaneo: ya no hay cero', () => {
    asentarIntentoFallido(bench.context, INTENTO)

    // Health Flow tenia cero filas en las diez tablas. Ahora, al menos, consta
    // que se intento y cuanto costo.
    expect(bench.cuantas('agent_runs')).toBe(1)
    expect(bench.cuantas('scans')).toBe(0)
  })
})
