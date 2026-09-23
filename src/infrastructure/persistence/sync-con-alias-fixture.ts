import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { Db } from './database'
import { REGISTRAR_ALIAS } from './finding-alias-sql'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteFindingRepository } from './sqlite-finding-repository'

export const P = 'p1'
export const AT1 = '2026-09-01T00:00:00Z'
export const AT2 = '2026-09-05T00:00:00Z'
// prettier-ignore
export const enLinea = (line: number, o: Partial<DetectedFinding> = {}): DetectedFinding => ({ severity: 'LOW', title: `sin tope en ${line}`, file: 'src/a.ts', line, tipo: 'rate-limit-ausente', simbolo: 'h', ...o })
export const clave = (line: number): string => `src/a.ts|${line}|rate-limit-ausente`

/** Base real en memoria con su repositorio: el sync de verdad, no un doble. */
export function banco(): { db: Db; repo: ReturnType<typeof createSqliteFindingRepository> } {
  const db = createMemoryDb()
  seedProject(db, P)
  return { db, repo: createSqliteFindingRepository(db) }
}

export const idDe = (db: Db, identity: string): string =>
  (db.prepare('SELECT id FROM findings WHERE identity = ?').get(identity) as { id: string }).id
export const fila = (db: Db, id: string): Record<string, unknown> =>
  db.prepare('SELECT * FROM findings WHERE id = ?').get(id) as Record<string, unknown>
export const filas = (db: Db): number =>
  (db.prepare('SELECT COUNT(*) n FROM findings').get() as { n: number }).n
export const aliasDe = (db: Db, clave: string): string | null =>
  (db.prepare('SELECT finding_id FROM finding_aliases WHERE project_id = ? AND clave = ?').get(P, clave) as { finding_id: string } | undefined)?.finding_id ?? null // prettier-ignore
export const registrar = (db: Db, clave: string, findingId: string): void =>
  void db.prepare(REGISTRAR_ALIAS).run({ projectId: P, clave, findingId, origen: 'test', at: AT1 })
