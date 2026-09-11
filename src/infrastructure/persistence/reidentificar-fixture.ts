import type { Db } from './database'
import { createMemoryDb, seedProject } from './memory-db'

export const PROYECTO = 'p1'

let n = 0

export interface Sembrada {
  readonly file: string
  readonly line: number | null
  readonly tipo: string
  readonly simbolo?: string
  readonly severity?: string
  /** Solo para las pre-ADR-067: la clave que la fila trae de antes. */
  readonly identity?: string
  readonly firstSeen?: string
}

const INSERT = `INSERT INTO findings
  (id, project_id, severity, title, file, line, fingerprint, identity, tipo, simbolo,
   status, lifecycle, created_at, first_seen, last_seen)
  VALUES (@id, @p, @severity, @title, @file, @line, '', @identity, @tipo, @simbolo,
  'open', 'ACTIVE', @at, @firstSeen, @at)`

/** Siembra con la clave de ADR-067 —`fichero│tipo│simbolo`— que es la que tiene
 *  hoy la base del operador, para que el backfill tenga algo que recalcular. */
export function sembrar(db: Db, filas: readonly Sembrada[]): string[] {
  const insert = db.prepare(INSERT)
  return filas.map((f) => {
    n += 1
    const id = `h${n}`
    const simbolo = f.simbolo ?? ''
    insert.run({
      id, p: PROYECTO, severity: f.severity ?? 'LOW', title: `t${n}`,
      file: f.file, line: f.line, tipo: f.tipo, simbolo,
      identity: f.identity ?? `${f.file}|${f.tipo}|${simbolo.toLowerCase()}`,
      at: '2026-09-01', firstSeen: f.firstSeen ?? `2026-09-${String(n % 28 + 1).padStart(2, '0')}`
    }) // prettier-ignore
    return id
  })
}

/** Devuelve los ids porque el contador es del MODULO: dos tests del mismo
 *  fichero no empiezan los dos en `h1`, y clavarlos volveria el test fragil
 *  ante cualquiera que anada un caso mas arriba. */
export function baseConHallazgos(filas: readonly Sembrada[]): { db: Db; ids: string[] } {
  const db = createMemoryDb()
  seedProject(db, PROYECTO)
  return { db, ids: sembrar(db, filas) }
}

export const vivas = (db: Db): number =>
  (db.prepare("SELECT COUNT(*) c FROM findings WHERE lifecycle != 'EXTINCT'").get() as { c: number }).c // prettier-ignore
