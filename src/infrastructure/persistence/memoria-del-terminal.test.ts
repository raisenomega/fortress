import { beforeEach, describe, expect, it } from 'vitest'
import { createBench, PROJECT, SSRF, type Bench } from './finding-fixture'
import { runMigrations } from './migrations'

let bench: Bench
let id = ''

const columnas = (): string[] =>
  (bench.db.pragma('table_info(findings)') as Array<{ name: string }>).map((c) => c.name)

beforeEach(() => {
  bench = createBench()
  bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
  id = bench.memoryOf(SSRF.title)?.id ?? ''
})

describe('la memoria del productor en su columna, sobre SQLite real (ADR-088, Enm. 2)', () => {
  it('un hallazgo nace sin memoria, la recuerda, la sustituye y la olvida', () => {
    expect(bench.repo.sesionDelTerminal(id)).toBeNull()

    bench.repo.recordarSesionDelTerminal(id, 'ses-1')
    expect(bench.repo.sesionDelTerminal(id)).toBe('ses-1')

    bench.repo.recordarSesionDelTerminal(id, 'ses-2')
    expect(bench.repo.sesionDelTerminal(id)).toBe('ses-2')

    bench.repo.olvidarSesionDelTerminal(id)
    expect(bench.repo.sesionDelTerminal(id)).toBeNull()
  })

  it('recordar no toca el ciclo de vida: un mitigado sigue mitigado', () => {
    bench.repo.markMitigated(id, 'arreglado por el Terminal', '2026-09-15T10:00:00Z')
    bench.repo.recordarSesionDelTerminal(id, 'ses-1')

    expect(bench.memoryOf(SSRF.title)?.lifecycle).toBe('MITIGATED')
  })
})

describe('la migracion es aditiva e idempotente', () => {
  it('una base anterior gana la columna, y sus filas nacen en NULL', () => {
    // Asi estaba la base antes de esta pieza: sin la columna.
    bench.db.exec('ALTER TABLE findings DROP COLUMN terminal_sesion')
    expect(columnas()).not.toContain('terminal_sesion')

    runMigrations(bench.db)

    expect(columnas()).toContain('terminal_sesion')
    expect(bench.repo.sesionDelTerminal(id)).toBeNull()
  })

  it('correrla otra vez no rompe ni duplica, y no borra lo que ya recordaba', () => {
    bench.repo.recordarSesionDelTerminal(id, 'ses-1')

    runMigrations(bench.db)
    runMigrations(bench.db)

    expect(columnas().filter((c) => c === 'terminal_sesion')).toHaveLength(1)
    expect(bench.repo.sesionDelTerminal(id)).toBe('ses-1')
  })
})
