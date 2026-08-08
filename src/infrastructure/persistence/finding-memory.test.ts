import { beforeEach, describe, expect, it } from 'vitest'
import { API_KEY, createBench, PROJECT, SSRF, type Bench } from './finding-fixture'

let bench: Bench

beforeEach(() => {
  bench = createBench()
})

describe('memoria de hallazgos: la base CONSERVA, no borra', () => {
  it('LO QUE IMPORTA: un hallazgo que deja de reportarse NO se borra', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF, API_KEY], '2026-08-08T10:00:00Z')
    expect(bench.rows()).toBe(2)

    // El escaneo nuevo no nombra el SSRF. Antes esto lo eliminaba de la tabla y
    // la unica forma de saber si seguia vivo era adivinar.
    bench.repo.syncFromScan(PROJECT, 's2', [API_KEY], '2026-08-09T10:00:00Z')

    expect(bench.rows()).toBe(2)
    expect(bench.memoryOf(SSRF.title)?.lifecycle).toBe('ACTIVE')
  })

  it('ausente NO es resuelto: se distingue por su lastSeen, sin borrar nada', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF, API_KEY], '2026-08-08T10:00:00Z')
    bench.repo.syncFromScan(PROJECT, 's2', [API_KEY], '2026-08-09T10:00:00Z')

    expect(bench.memoryOf(SSRF.title)?.lastSeen).toBe('2026-08-08T10:00:00Z')
    expect(bench.memoryOf(API_KEY.title)?.lastSeen).toBe('2026-08-09T10:00:00Z')
  })

  it('sobrevive a varios escaneos conservando su fila, su id y su clave', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    const primera = bench.memoryOf(SSRF.title)

    for (const [scan, at] of [
      ['s2', '2026-08-09T10:00:00Z'],
      ['s3', '2026-08-10T10:00:00Z'],
      ['s4', '2026-08-11T10:00:00Z']
    ]) {
      bench.repo.syncFromScan(PROJECT, scan, [SSRF], at)
    }

    expect(bench.rows()).toBe(1)
    expect(bench.memoryOf(SSRF.title)?.id).toBe(primera?.id)
    expect(bench.memoryOf(SSRF.title)?.identity).toBe(primera?.identity)
  })

  it('reaparecer tras estar ausente no duplica la fila ni pierde el historial', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    bench.repo.syncFromScan(PROJECT, 's2', [], '2026-08-09T10:00:00Z')
    bench.repo.syncFromScan(PROJECT, 's3', [SSRF], '2026-08-10T10:00:00Z')

    expect(bench.rows()).toBe(1)
    expect(bench.memoryOf(SSRF.title)?.firstSeen).toBe('2026-08-08T10:00:00Z')
    expect(bench.memoryOf(SSRF.title)?.lastSeen).toBe('2026-08-10T10:00:00Z')
  })
})

describe('memoria de hallazgos: que cuentan los contadores', () => {
  it('CONSECUENCIA CONOCIDA: un ausente sigue contando hasta que se extinga', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF, API_KEY], '2026-08-08T10:00:00Z')
    bench.repo.syncFromScan(PROJECT, 's2', [API_KEY], '2026-08-09T10:00:00Z')

    // Los conteos miran las filas abiertas, y el ausente sigue abierto. Es
    // deliberado: nadie ha demostrado que se arreglara. Quien decida que un
    // ausente esta extinto es la REGLA DE EXTINCION, que aun no existe.
    expect(bench.repo.countsByProject()[PROJECT]).toMatchObject({ MEDIUM: 1, LOW: 1 })
  })
})
