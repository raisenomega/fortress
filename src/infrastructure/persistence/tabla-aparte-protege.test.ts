import { beforeEach, describe, expect, it } from 'vitest'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { correrRecorrido, crearBench } from './banco-del-recorrido'
import { PROYECTO, type Bench } from './cierre-partido-fixture'
import { CUATRO } from './recorrido-fixture'

const SCANNER = 'security-reviewer'

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

const corridas = (): number =>
  (bench.db.prepare('SELECT COUNT(*) n FROM agent_runs').get() as { n: number }).n

describe('la serie por parada NO mueve agent_runs', () => {
  it('cuatro paradas dejan 4 filas de serie y UNA sola corrida agregada', async () => {
    const { serie } = await correrRecorrido(bench, CUATRO)

    expect(serie()).toHaveLength(4)
    expect(corridas()).toBe(1)
  })

  it('las cuentas que alimentan el compliance no se dividen entre cuatro', async () => {
    await correrRecorrido(bench, CUATRO)

    // `totalsFor.runs` va al compliance del superdashboard y a `tokensPerRun`.
    // Con la serie en `agent_runs` valdria 4 y los dos se moverian solos.
    expect(bench.context.runs.totalsFor(SCANNER, PROYECTO).runs).toBe(1)
  })

  it('y las DOS cifras con las que OMEGA puntua al escaner tampoco', async () => {
    const { serie } = await correrRecorrido(bench, CUATRO)
    const t = bench.context.runs.totalsFor(SCANNER, PROYECTO)

    // `scoreProject` alimenta `computeScore` con estas dos. Si la serie viviera
    // en `agent_runs`, `runs` valdria 4 y el compliance del escaner se moveria
    // sin que nadie hubiera tocado el escaner.
    expect({ runs: t.runs, failed: t.failed }).toEqual({ runs: 1, failed: 0 })
    expect(serie()).toHaveLength(4)
  })
})

describe('el gasto diario no se cuenta dos veces', () => {
  it('usageSince lee agent_runs, y la serie vive en otra tabla', async () => {
    const conTema: Manifiesto = { ...CUATRO, modulosAplicables: [] }

    const { serie } = await correrRecorrido(bench, conTema)
    const gasto = bench.context.runs.usageSince('2000-01-01T00:00:00.000Z')

    // Cuatro filas de serie no han sumado ni un turno al gasto del dia.
    expect(serie()).toHaveLength(4)
    expect(gasto.numTurns).toBe(0)
  })
})
