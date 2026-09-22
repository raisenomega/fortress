import type { Db } from './database'
import { createMemoryDb, seedProject } from './memory-db'

export const PROYECTO = 'p1'

/** Solo lo que los criterios miran. El resto de columnas las pone el INSERT con
 *  valores que ninguno consulta: un fixture que declare de mas invita a probar
 *  otra cosa sin darse cuenta. */
export interface Fila {
  readonly id: string
  readonly identity: string
  readonly tipo?: string
  readonly lifecycle?: string
  readonly extinctReason?: string | null
  readonly resolvedAt?: string | null
  /** Donde vive: por defecto todas en el mismo sitio, que es lo que los criterios miran. */
  readonly file?: string
  readonly line?: number | null
  /** Lo que la fusion decide y escribe: quien es mas antigua, y que gravedad queda. */
  readonly firstSeen?: string
  readonly severity?: string
}

const INSERT = `INSERT INTO findings
  (id, project_id, severity, title, file, line, created_at, identity, tipo, simbolo,
   lifecycle, first_seen, last_seen, extinct_reason, resolved_at)
  VALUES (@id, @proyecto, @severity, 't', @file, @line, @at, @identity, @tipo, 's',
   @lifecycle, @firstSeen, @at, @extinctReason, @resolvedAt)`

/**
 * Base REAL en memoria: mismo esquema y mismas migraciones que la del operador.
 * El SQL ES la mitad de lo que estos criterios deciden —un GLOB, un LIKE, un
 * HAVING—, y contra un doble no se probaria ninguna de las dos mitades.
 *
 * Nunca la base del operador, y ni siquiera un fichero en /tmp: `:memory:` no
 * deja nada que un test mal escrito pueda confundir con una base de verdad.
 */
export function baseCon(filas: readonly Fila[]): Db {
  const db = createMemoryDb()
  seedProject(db, PROYECTO)
  const insert = db.prepare(INSERT)
  for (const f of filas) {
    insert.run({
      id: f.id,
      proyecto: PROYECTO,
      at: '2026-08-01T00:00:00Z',
      identity: f.identity,
      tipo: f.tipo ?? 'path-traversal',
      lifecycle: f.lifecycle ?? 'ACTIVE',
      extinctReason: f.extinctReason ?? null,
      resolvedAt: f.resolvedAt ?? null,
      file: f.file ?? 'f.ts',
      line: f.line === undefined ? 1 : f.line,
      firstSeen: f.firstSeen ?? '2026-08-01T00:00:00Z',
      severity: f.severity ?? 'MEDIUM'
    })
  }
  return db
}

/** La clave de hoy y la de antes de ADR-067, para no repetirlas en cada test. */
export const NUEVA = 'src/domain/repair/allowed-files.ts|path-traversal|computeallowedfiles'
export const VIEJA = 'MEDIUM|src/domain/repair/allowed-files.ts|La correa acepta rutas con ..'
