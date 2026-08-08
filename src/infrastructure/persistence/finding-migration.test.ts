import { beforeEach, describe, expect, it } from 'vitest'
import { createBench, PROJECT, SSRF, type Bench } from './finding-fixture'
import { runMigrations } from './migrations'

let bench: Bench

/** Fila tal y como la dejaba la version anterior: sin identity ni fechas. */
function insertLegacy(severity: string, title: string, file: string): void {
  bench.db
    .prepare(
      `INSERT INTO findings (id, project_id, severity, title, file, line, created_at)
       VALUES ('vieja', ?, ?, ?, ?, 7, '2026-07-01T00:00:00Z')`
    )
    .run(PROJECT, severity, title, file)
}

beforeEach(() => {
  bench = createBench()
})

describe('migracion de las filas que ya existen', () => {
  it('les pone clave e historia SIN inventarse fechas', () => {
    insertLegacy('HIGH', 'Algo de antes', 'src/a.ts')
    expect(bench.memoryOf('Algo de antes')?.identity).toBe('')

    runMigrations(bench.db)

    const migrada = bench.memoryOf('Algo de antes')
    expect(migrada?.identity).toContain('src/a.ts')
    // La historia sale de created_at. Ponerle la fecha de hoy haria parecer
    // recien visto un problema que lleva semanas abierto.
    expect(migrada?.firstSeen).toBe('2026-07-01T00:00:00Z')
    expect(migrada?.lastSeen).toBe('2026-07-01T00:00:00Z')
    expect(migrada?.lifecycle).toBe('ACTIVE')
  })

  it('la fila migrada se RECONOCE en el siguiente escaneo: no se duplica', () => {
    insertLegacy('MEDIUM', SSRF.title, SSRF.file)
    runMigrations(bench.db)

    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')

    expect(bench.rows()).toBe(1)
    expect(bench.memoryOf(SSRF.title)?.id).toBe('vieja')
    expect(bench.memoryOf(SSRF.title)?.firstSeen).toBe('2026-07-01T00:00:00Z')
  })

  it('es idempotente: repetirla no reescribe lo ya migrado', () => {
    insertLegacy('LOW', 'Algo de antes', 'src/a.ts')
    runMigrations(bench.db)
    const primera = bench.memoryOf('Algo de antes')

    runMigrations(bench.db)
    runMigrations(bench.db)

    expect(bench.memoryOf('Algo de antes')).toEqual(primera)
    expect(bench.rows()).toBe(1)
  })
})
