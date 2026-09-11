import { beforeEach, describe, expect, it } from 'vitest'
import { createBench, PROJECT, SSRF, type Bench } from './finding-fixture'
import { runMigrations } from './migrations'

let bench: Bench

/** Fila tal y como la dejaba la version anterior: sin identity ni fechas.
 *  La LINEA es parte de la clave desde ADR-084, asi que el banco la declara en
 *  vez de clavar un 7 que nunca cuadraba con la del hallazgo. */
function insertLegacy(
  severity: string,
  title: string,
  file: string,
  line: number | null = 7
): void {
  bench.db
    .prepare(
      `INSERT INTO findings (id, project_id, severity, title, file, line, created_at)
       VALUES ('vieja', ?, ?, ?, ?, ?, '2026-07-01T00:00:00Z')`
    )
    .run(PROJECT, severity, title, file, line)
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
    // En SU linea: la migracion le calcula la clave con la formula de hoy, y
    // reconocer significa que el escaneo llega al mismo sitio.
    insertLegacy('MEDIUM', SSRF.title, SSRF.file, SSRF.line)
    runMigrations(bench.db)

    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())

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
