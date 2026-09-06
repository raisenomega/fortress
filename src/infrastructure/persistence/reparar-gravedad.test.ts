import { beforeEach, describe, expect, it } from 'vitest'
import { supervivientesDegradadas } from '@domain/project/severidad-al-fundir'
import { masUrgente } from '@domain/shared/severity'
import { createBench, PROJECT, type Bench } from './finding-fixture'
import { repararGravedad } from './reparar-gravedad'
import { dosVictimas, filaDe } from './reparar-gravedad-fixture'

let bench: Bench
const victimas = (p: Parameters<typeof supervivientesDegradadas>[0]): ReturnType<typeof supervivientesDegradadas> => supervivientesDegradadas(p, masUrgente) // prettier-ignore
const reparar = (): ReturnType<typeof repararGravedad> =>
  repararGravedad(bench.db, PROJECT, victimas)
const fila = (id: string): Record<string, unknown> => filaDe(bench, id)
beforeEach(() => {
  bench = createBench()
  dosVictimas(bench)
})

describe('reparar los grupos fundidos antes de que la regla existiera', () => {
  it('sube cada superviviente a la maxima de SU grupo', () => {
    expect(reparar().map((v) => v.id).sort()).toEqual(['argv', 'correa']) // prettier-ignore

    expect(fila('correa').severity).toBe('HIGH')
    expect(fila('argv').severity).toBe('MEDIUM')
  })

  it('no toca nada mas: ni la fecha, ni el ciclo, ni las absorbidas', () => {
    reparar()

    expect(fila('correa').first_seen).toBe('2026-07-01T00:00:00Z')
    expect(fila('argv').lifecycle).toBe('MITIGATED')
    expect(fila('correa-abs').severity).toBe('HIGH')
    expect(fila('correa-abs').lifecycle).toBe('EXTINCT')
  })

  it('despues, la red no encuentra ninguna degradada', () => {
    reparar()

    const parejas = bench.db
      .prepare(
        `SELECT g.id, g.severity AS viva, a.severity AS absorbida FROM findings g
         JOIN findings a ON a.extinct_reason = 'fusionada-con-' || g.id
         WHERE g.project_id = ? AND g.lifecycle != 'EXTINCT'`
      )
      .all(PROJECT)
    expect(victimas(parejas as never)).toEqual([])
  })

  it('es idempotente: la segunda corrida no encuentra nada que reparar', () => {
    reparar()

    expect(reparar()).toEqual([])
    expect(fila('correa').severity).toBe('HIGH')
  })
})
