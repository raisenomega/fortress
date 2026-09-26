import Database from 'better-sqlite3'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { graphSlug } from '@domain/graph/graph-slug'
import type { GraphStats } from '@domain/graph/graph-status'

/** La cache REAL del grafo, la del operador: aqui leen y escriben las acciones de FORTRESS. */
export const CACHE_REAL_DEL_GRAFO = join(homedir(), '.cache', 'codebase-memory-mcp')
const DIR = CACHE_REAL_DEL_GRAFO

interface ProjectRow {
  indexed_at?: string
  root_path?: string
}

/**
 * Lee el indice REAL del grafo (SQLite de codebase-memory-mcp v0.9). Ya no se
 * adivina el esquema: nodes, edges, file_hashes y projects son sus tablas.
 * Solo lectura; si el archivo no existe o algo falla, null y el panel lo dice.
 */
export function readGraphIndex(projectPath: string): GraphStats | null {
  const file = join(DIR, `${graphSlug(projectPath)}.db`)
  if (!existsSync(file)) return null

  let db: Database.Database | null = null
  try {
    db = new Database(file, { readonly: true, fileMustExist: true })
    const count = (table: string): number =>
      (db!.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c
    const proj = db.prepare('SELECT indexed_at, root_path FROM projects LIMIT 1').get() as
      ProjectRow | undefined

    return {
      nodes: count('nodes'),
      edges: count('edges'),
      files: count('file_hashes'),
      indexedAt: proj?.indexed_at ?? null,
      rootPath: proj?.root_path ?? null
    }
  } catch {
    return null
  } finally {
    db?.close()
  }
}
