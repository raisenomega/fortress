import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

/**
 * Bases de FIXTURE en /tmp — nunca la del operador. Existe porque los guards
 * solo se pueden probar contra bases de verdad, y probarlos contra la real fue
 * exactamente el incidente que estos tests cierran.
 */
export interface Temporal {
  ruta(nombre: string): string
  /** SQLite legible pero SIN la tabla que importa. */
  vacia(nombre: string): string
  conFindings(nombre: string, ids: readonly string[]): string
  limpiar(): void
}

export function temporal(): Temporal {
  let dir: string | null = null
  const ruta = (nombre: string): string => {
    dir = dir ?? mkdtempSync(join(tmpdir(), 'guardas-'))
    return join(dir, nombre)
  }

  return {
    ruta,
    vacia: (nombre) => {
      const p = ruta(nombre)
      new Database(p).close()
      return p
    },
    conFindings: (nombre, ids) => {
      const p = ruta(nombre)
      const db = new Database(p)
      // Las columnas que tocan las consultas reales, no solo el id: asi el
      // fixture sirve igual para el guard del backup y para el modo plan.
      db.exec(`CREATE TABLE findings (id TEXT, project_id TEXT, severity TEXT,
        lifecycle TEXT, extinct_reason TEXT)`)
      const ins = db.prepare('INSERT INTO findings VALUES (?, ?, ?, ?, NULL)')
      for (const id of ids) ins.run(id, 'p', 'MEDIUM', 'ACTIVE')
      db.close()
      return p
    },
    limpiar: () => {
      if (dir !== null) rmSync(dir, { recursive: true, force: true })
      dir = null
    }
  }
}
