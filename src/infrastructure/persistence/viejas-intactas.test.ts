import { describe, expect, it } from 'vitest'
import { createMemoryDb } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'
import { migrarDatos } from './migraciones-de-datos'
import type { Db } from './database'

/** Una fila como las 350 del operador: `area` en texto libre, escrita antes de
 *  que el vocabulario existiera. Se inserta por SQL porque `add` ya lo cierra. */
const VIEJA = `INSERT INTO self_observations
  (id, source_project, kind, area, note, resolved, created_at)
  VALUES (@id, @p, 'limitacion', @area, @note, 0, '2026-09-01')`

const sembrarVieja = (db: Db, id: string, p: string, area: string, note = 'n'): void => {
  db.prepare(VIEJA).run({ id, p, area, note })
}

describe('las 350 viejas NO se reclasifican aqui: el backfill es otro gesto', () => {
  it('su `area` de texto libre se queda tal cual', () => {
    // Reconocer que `permisos MCP` es `permisos-de-herramienta` exige juicio: el
    // 33 % del corpus casa con DOS clases a la vez. Adivinar aqui clasificaria
    // mal una de cada tres, y eso es lo que ADR-081 y ADR-084 se negaron a hacer.
    const db = createMemoryDb()
    sembrarVieja(db, 'v1', 'mailbd', 'permisos MCP / codebase-memory')

    migrarDatos(db)

    const [vieja] = createSqliteSelfObservationRepository(db).listOpen()
    expect(vieja.area).toBe('permisos MCP / codebase-memory')
  })

  it('pero SI gana su primer avistamiento, o el orden la hundiria', () => {
    const db = createMemoryDb()
    sembrarVieja(db, 'v1', 'mailbd', 'permisos MCP')

    migrarDatos(db)

    expect(createSqliteSelfObservationRepository(db).vistaEn('v1')).toBe(1)
  })

  it('y una NUEVA del mismo tema NO se funde con ella: son areas distintas', () => {
    // Consecuencia honesta de no reclasificar: hasta el backfill, lo viejo y lo
    // nuevo viven aparte aunque hablen de lo mismo. Es visible y acotado, y es
    // preferible a fundir por una traduccion adivinada.
    const db = createMemoryDb()
    sembrarVieja(db, 'v1', 'mailbd', 'permisos MCP')
    const r = createSqliteSelfObservationRepository(db)
    migrarDatos(db)

    r.add({ kind: 'limitacion', area: 'permisos-de-herramienta', sourceProject: 'acme', note: 'n' })

    expect(r.listOpen()).toHaveLength(2)
  })

  it('correr la migracion dos veces no duplica avistamientos', () => {
    const db = createMemoryDb()
    sembrarVieja(db, 'v1', 'mailbd', 'permisos MCP')

    migrarDatos(db)
    migrarDatos(db)

    expect(createSqliteSelfObservationRepository(db).vistaEn('v1')).toBe(1)
  })
})
