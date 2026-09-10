import { beforeEach, describe, expect, it } from 'vitest'
import { cerrarEscaneo } from '@application/scan/cerrar-escaneo'
import { asentarHallazgos } from '@application/scan/asentar-hallazgos'
import { crearBench, PROJECT, PROYECTO, SIN_FACTURA, type Bench } from './cierre-partido-fixture'

const AT = '2026-09-09T22:00:00.000Z'
const UNO = [{ severity: 'HIGH' as const, title: 'Algo', file: 'a.ts', line: 1 }]

const cierre = {
  paradasHechas: 4,
  paradasTotal: 12,
  ficherosCubiertos: 700,
  ficherosTotal: 2108,
  at: AT,
  durationMs: 900_000,
  usage: SIN_FACTURA,
  tools: [],
  edits: []
}

let bench: Bench
let scanId: string

beforeEach(() => {
  bench = crearBench()
  scanId = bench.context.scans.abrir({
    projectId: PROYECTO,
    startedAt: AT,
    paradasTotal: 12,
    ficherosTotal: 2108
  }).id
})

const fila = (): ReturnType<Bench['context']['scans']['listByProject']>[number] =>
  bench.context.scans.listByProject(PROYECTO, 10)[0]

describe('un escaneo que se abre y nunca cierra', () => {
  it('queda ABIERTO con el score provisional, aunque haya guardado hallazgos', async () => {
    await asentarHallazgos(bench.context, PROJECT, scanId, UNO, AT)

    expect(fila().estado).toBe('ABIERTO')
    expect(fila().score).toBe(0)
    // El cero NO es una nota: es la marca de que todavia no hay nota. Quien lo
    // lee sabe que es provisional porque `estado` lo dice, no por el numero.
    expect(fila().motivoCierre).toBeNull()
    expect(fila().paradasHechas).toBeNull()
  })

  it('lo que ya guardo NO se pierde: cuatro paradas siguen siendo cuatro', async () => {
    await asentarHallazgos(bench.context, PROJECT, scanId, UNO, AT)

    const vivos = bench.context.findings.listMemory(PROYECTO)
    expect(vivos).toHaveLength(1)
    expect(vivos[0].lifecycle).toBe('ACTIVE')
  })
})

describe('un recorrido cortado se cierra ABORTADO', () => {
  it('el motivo viaja a la fila y el estado deja de ser CERRADO', async () => {
    await asentarHallazgos(bench.context, PROJECT, scanId, UNO, AT)

    cerrarEscaneo(bench.context, PROJECT, { scanId, reportados: UNO, motivo: 'timeout', ...cierre })

    expect(fila().estado).toBe('ABORTADO')
    expect(fila().motivoCierre).toBe('timeout')
    // Cuatro de doce paradas: la cobertura que alcanzo, escrita y verificable.
    expect(fila().paradasHechas).toBe(4)
    expect(fila().ficherosCubiertos).toBe(700)
    expect(fila().ficherosTotal).toBe(2108)
  })
})
