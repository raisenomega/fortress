import { describe, expect, it } from 'vitest'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteFindingRepository } from './sqlite-finding-repository'
import type { Db } from './database'

const AYER = '2026-08-20T10:00:00Z'
const HOY = '2026-08-21T10:00:00Z'

function seedFinding(db: Db, id: string): void {
  db.prepare(
    `INSERT INTO findings (id, project_id, severity, title, file, line, created_at, status, lifecycle)
     VALUES (?, 'p1', 'HIGH', 'el gate no exige confianza', 'a.ts', 19, ?, 'open', 'ACTIVE')`
  ).run(id, AYER)
}

function banco(): { db: Db; repo: ReturnType<typeof createSqliteFindingRepository> } {
  const db = createMemoryDb()
  seedProject(db, 'p1')
  seedFinding(db, 'f1')
  return { db, repo: createSqliteFindingRepository(db) }
}

const lifecycleDe = (db: Db, id: string): string =>
  (db.prepare('SELECT lifecycle FROM findings WHERE id = ?').get(id) as { lifecycle: string })
    .lifecycle

describe('el operador marca un hallazgo como ya arreglado', () => {
  it('un ACTIVE pasa a MITIGATED con su nota, sin tocar status', () => {
    const { db, repo } = banco()
    expect(repo.markMitigated('f1', 'arreglado en 447fd27', HOY)).toBe(true)

    const fila = db.prepare('SELECT * FROM findings WHERE id = ?').get('f1') as Record<string, unknown> // prettier-ignore
    expect(fila.lifecycle).toBe('MITIGATED')
    expect(fila.mitigated_note).toBe('arreglado en 447fd27')
    expect(fila.mitigated_at).toBe(HOY)
    expect(fila.status).toBe('open')
  })

  it('lo ya mitigado no se vuelve a marcar: el operador se entera', () => {
    const { repo } = banco()
    repo.markMitigated('f1', 'primera', HOY)
    expect(repo.markMitigated('f1', 'segunda', HOY)).toBe(false)
  })

  it('un hallazgo que ya no existe devuelve false', () => {
    expect(banco().repo.markMitigated('no-existe', 'x', HOY)).toBe(false)
  })

  it('un MITIGATED puede confirmarse EXTINCT: no queda atrapado', () => {
    const { db, repo } = banco()
    repo.markMitigated('f1', 'arreglado al lado', HOY)
    repo.markExtinct(['f1'], HOY, 'juicio_obsoleto', 'agente')
    expect(lifecycleDe(db, 'f1')).toBe('EXTINCT')
  })

  it('un ACTIVE sigue pudiendo extinguirse, como siempre', () => {
    const { db, repo } = banco()
    repo.markExtinct(['f1'], HOY, 'juicio_obsoleto', 'agente')
    expect(lifecycleDe(db, 'f1')).toBe('EXTINCT')
  })

  it('lo ya extinto no se puede mitigar hacia atras', () => {
    const { repo } = banco()
    repo.markExtinct(['f1'], HOY, 'juicio_obsoleto', 'agente')
    expect(repo.markMitigated('f1', 'tarde', HOY)).toBe(false)
  })

  it('sigue visible en el tablero, con su nota y su ciclo de vida', () => {
    const { repo } = banco()
    repo.markMitigated('f1', 'arreglado en 447fd27', HOY)
    const fila = repo.listByProject('p1').find((f) => f.id === 'f1')
    expect(fila).toMatchObject({ lifecycle: 'MITIGATED', mitigatedNote: 'arreglado en 447fd27' })
  })
})
