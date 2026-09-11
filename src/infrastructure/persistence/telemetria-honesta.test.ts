import { beforeEach, describe, expect, it } from 'vitest'
import { asentarIntentoFallido } from '@application/scan/asentar-intento-fallido'
import { crearBench } from './banco-del-recorrido'
import { cerrarSinParadas, QUINCE_MIN } from './cierre-sin-paradas-fixture'
import { PROYECTO, SIN_FACTURA, type Bench } from './cierre-partido-fixture'

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

/** Lo que `claude-scanner` asienta cuando no hubo informe: la factura real. */
const asentarLaFactura = (): void =>
  asentarIntentoFallido(bench.context, {
    projectId: PROYECTO,
    motivo: 'proceso',
    durationMs: QUINCE_MIN,
    usage: SIN_FACTURA,
    tools: [],
    texto: 'murio a mitad'
  })

const filaScan = (): Record<string, unknown> =>
  bench.db.prepare('SELECT duration_ms FROM scans').get() as Record<string, unknown>

const corridas = (): Array<Record<string, unknown>> =>
  bench.db.prepare('SELECT duration_ms, failed FROM agent_runs').all() as Array<
    Record<string, unknown>
  >

describe('la fila del scan dice cuanto duro, no cuanto se audito', () => {
  it('quince minutos ardidos con cero paradas NO son «duro 0»', () => {
    cerrarSinParadas(bench, 'fallo')

    expect(filaScan().duration_ms).toBe(QUINCE_MIN)
  })
})

describe('una corrida, una factura', () => {
  it('tras un FALLO ya asentado, el cierre no anade una segunda de ceros', () => {
    asentarLaFactura()

    cerrarSinParadas(bench, 'fallo')

    expect(corridas()).toEqual([{ duration_ms: QUINCE_MIN, failed: 1 }])
  })

  it('un cierre COMPLETO si asienta la suya: el camino bueno no cambia', () => {
    cerrarSinParadas(bench, 'completo')

    expect(corridas()).toHaveLength(1)
    expect(corridas()[0].failed).toBe(0)
  })

  it('y un ABORTADO tambien: ahi nadie asento nada antes', () => {
    cerrarSinParadas(bench, 'abortado')

    expect(corridas()).toHaveLength(1)
    expect(corridas()[0].failed).toBe(1)
  })
})

describe('las dos cifras del mismo escaneo concuerdan', () => {
  it('la fila del scan y la factura dicen lo mismo, no 0 contra 901727', () => {
    asentarLaFactura()

    cerrarSinParadas(bench, 'fallo')

    expect(filaScan().duration_ms).toBe(corridas()[0].duration_ms)
  })
})
