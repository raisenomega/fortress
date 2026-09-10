import { beforeEach, describe, expect, it } from 'vitest'
import { recorrerParadas } from '@application/scan/recorrer-paradas'
import { SIN_SALIDAS } from '@application/scan/progreso-del-recorrido'
import { crearBench, PROJECT, type Bench } from './cierre-partido-fixture'
import { CUATRO, scannerFalso } from './recorrido-fixture'

let bench: Bench

const corridas = (): Record<string, unknown>[] =>
  bench.db.prepare('SELECT failed, cost_usd, duration_ms, kind FROM agent_runs').all() as Record<string, unknown>[] // prettier-ignore

beforeEach(() => {
  bench = crearBench()
})

describe('un recorrido que ABORTA no se cuenta como exito (deuda de 4b)', () => {
  it('el operador Detiene → la corrida del recorrido va failed:true', async () => {
    let detenido = false
    const scanner = scannerFalso((c) => (detenido = c === 'auth'))

    await recorrerParadas(bench.context, scanner, PROJECT, CUATRO, SIN_SALIDAS, {
      cancelado: () => detenido
    })

    expect(corridas()[0].failed).toBe(1)
  })

  it('el recorrido COMPLETO sigue yendo failed:false, con su factura', async () => {
    await recorrerParadas(bench.context, scannerFalso(), PROJECT, CUATRO, SIN_SALIDAS, {
      cancelado: () => false
    })

    expect(corridas()[0].failed).toBe(0)
  })
})
