import { describe, expect, it } from 'vitest'
import { correrRecorrido, crearBench } from './banco-del-recorrido'
import { PROYECTO, SIN_FACTURA, type Bench } from './cierre-partido-fixture'
import { runMigrations } from './migrations'
import { CUATRO } from './recorrido-fixture'
import type { FacturaDeParada } from './scanner-falso'

const OPUS = 'claude-opus-5-5'
const HAIKU = 'claude-haiku-4-5-20251001'

/** Cada parada corre con el modelo que diga su carpeta; ausente = sin modelo. */
const conModelo = (porCarpeta: Record<string, string>): FacturaDeParada => (carpeta) => ({
  durationMs: 1,
  usage: SIN_FACTURA,
  ...(porCarpeta[carpeta] === undefined ? {} : { modelo: porCarpeta[carpeta] })
})

const agregada = (bench: Bench): { modelo: unknown } =>
  bench.db.prepare("SELECT modelo FROM agent_runs WHERE kind = 'scan'").get() as { modelo: unknown } // prettier-ignore

describe('la corrida AGREGADA del escaneo lleva el modelo', () => {
  it('uniforme: todas las paradas en el mismo, la fila dice ese', async () => {
    const bench = crearBench()
    const todas = { auth: OPUS, payment: OPUS, web: OPUS, utils: OPUS }

    const { serie } = await correrRecorrido(bench, CUATRO, undefined, conModelo(todas))

    expect(agregada(bench).modelo).toBe(OPUS)
    // Y la serie lleva el suyo por fila, que es lo que la hace serie.
    expect(serie().map((r) => r.modelo)).toEqual([OPUS, OPUS, OPUS, OPUS])
  })

  it('mezcla: la fila dice el PELDANO MAS BAJO visto, no el mas alto', async () => {
    const bench = crearBench()
    const mezcla = { auth: OPUS, payment: OPUS, web: OPUS, utils: HAIKU }

    const { serie } = await correrRecorrido(bench, CUATRO, undefined, conModelo(mezcla))

    expect(agregada(bench).modelo).toBe(HAIKU)
    expect(serie().map((r) => r.modelo)).toEqual([OPUS, OPUS, OPUS, HAIKU])
  })

  it('candado: una parada sin modelo deja la agregada en NULL — no se infiere', async () => {
    const bench = crearBench()
    const aMedias = { auth: OPUS, payment: OPUS, utils: OPUS }

    await correrRecorrido(bench, CUATRO, undefined, conModelo(aMedias))

    expect(agregada(bench).modelo).toBeNull()
  })
})

describe('las filas viejas del escaner', () => {
  it('candado: QUEDAN null tras migrar — sin backfill, declarado no es corrido', () => {
    const bench = crearBench()
    bench.db.exec(`INSERT INTO agent_runs (id, project_id, kind, at) VALUES ('r-vieja', '${PROYECTO}', 'scan', 't')`) // prettier-ignore

    runMigrations(bench.db)

    const vieja = bench.db.prepare("SELECT modelo FROM agent_runs WHERE id = 'r-vieja'").get() as { modelo: unknown } // prettier-ignore
    expect(vieja.modelo).toBeNull()
  })
})
