import { describe, expect, it } from 'vitest'
import type { Db } from './database'
import { runMigrations } from './migrations'
import { baseConScanViejo, columnasDeScans, PROYECTO, VIEJA } from './scan-legacy-fixture'
import { createSqliteScanHistoryRepository } from './sqlite-scan-history-repository'

const NUEVAS = [
  'estado',
  'started_at',
  'paradas_total',
  'paradas_hechas',
  'ficheros_total',
  'ficheros_cubiertos',
  'motivo_cierre'
]

const leer = (db: Db): Record<string, unknown> =>
  db.prepare('SELECT * FROM scans WHERE id = ?').get(VIEJA.id) as Record<string, unknown>

describe('la fila que ya existia sobrevive la migracion', () => {
  it('la tabla vieja NO tiene las columnas del recorrido antes de migrar', () => {
    const db = baseConScanViejo()
    for (const columna of NUEVAS) expect(columnasDeScans(db)).not.toContain(columna)
  })

  it('queda CERRADO, con lo nuevo en NULL y el score intacto', () => {
    const db = baseConScanViejo()

    runMigrations(db)

    const fila = leer(db)
    // El default es el lado seguro: lo que ya estaba ahi son escaneos
    // TERMINADOS. Llamarlos abiertos los dejaria esperando un cierre eterno.
    expect(fila.estado).toBe('CERRADO')
    // Ausente es "no se midio", que es la verdad de una fila anterior a las
    // paradas. No es cero: cero afirmaria que se contaron y salieron cero.
    for (const columna of NUEVAS.slice(1)) expect(fila[columna]).toBeNull()
    // Lo que ya valia sigue valiendo, byte a byte.
    expect(fila.score).toBe(VIEJA.score)
    expect(fila.finding_count).toBe(VIEJA.findingCount)
    expect(fila.dossier_count).toBe(VIEJA.dossierCount)
    expect(fila.critical_count).toBe(VIEJA.criticalCount)
    expect(fila.duration_ms).toBe(VIEJA.durationMs)
    expect(fila.at).toBe(VIEJA.at)
  })
})

describe('lo que el dominio ve de esa fila migrada', () => {
  it('la lee como CERRADO sin inventarle recorrido', () => {
    const db = baseConScanViejo()
    runMigrations(db)

    const [leida] = createSqliteScanHistoryRepository(db).listByProject(PROYECTO, 10)

    expect(leida.estado).toBe('CERRADO')
    expect(leida.score).toBe(VIEJA.score)
    expect(leida.paradasTotal).toBeNull()
    expect(leida.ficherosCubiertos).toBeNull()
  })

  it('es idempotente: repetirla no falla ni reescribe la fila', () => {
    const db = baseConScanViejo()
    runMigrations(db)
    const primera = leer(db)

    expect(() => {
      runMigrations(db)
      runMigrations(db)
    }).not.toThrow()

    expect(leer(db)).toEqual(primera)
    expect((db.prepare('SELECT COUNT(*) AS n FROM scans').get() as { n: number }).n).toBe(1)
  })
})
