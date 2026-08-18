import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import type { LoopSession } from '@domain/loop/loop-session'
import { SCHEMA } from './schema'
import { createSqliteLoopSessionRepository } from './sqlite-loop-session-repository'

let repo: ReturnType<typeof createSqliteLoopSessionRepository>

const SESION: LoopSession = {
  projectId: 'p1',
  active: false,
  cyclesDone: 2,
  recentScores: [100, 92],
  spentBaseline: 1.25,
  updatedAt: ''
}

beforeEach(() => {
  const db = new Database(':memory:')
  db.exec(SCHEMA)
  // La sesion cuelga de un proyecto real: sin el, la clave foranea la rechaza.
  db.prepare("INSERT INTO projects (id, name, path, created_at) VALUES ('p1', 'P', '/tmp/p', '')").run() // prettier-ignore
  repo = createSqliteLoopSessionRepository(db)
})

describe('sesiones de loop: la razon de parada sobrevive al cierre', () => {
  it('guarda y devuelve el motivo con su cifra y su momento', () => {
    repo.save({
      ...SESION,
      stoppedReason: 'tope-gasto',
      stoppedReasonDetail: '$5.00 de $5.00',
      stoppedAt: '2026-08-17T04:00:00.000Z'
    })

    expect(repo.get('p1')).toMatchObject({
      stoppedReason: 'tope-gasto',
      stoppedReasonDetail: '$5.00 de $5.00',
      stoppedAt: '2026-08-17T04:00:00.000Z'
    })
  })

  it('una sesion sin motivo no se inventa ninguno', () => {
    repo.save(SESION)

    const leida = repo.get('p1')
    expect(leida?.stoppedReason).toBeUndefined()
    expect(leida?.stoppedReasonDetail).toBeUndefined()
    expect(leida?.cyclesDone).toBe(2)
  })

  it('arrancar de nuevo borra el motivo de la sesion anterior', () => {
    repo.save({ ...SESION, stoppedReason: 'resuelto', stoppedAt: '2026-08-17T04:00:00.000Z' })
    repo.save({ ...SESION, active: true })

    expect(repo.get('p1')?.stoppedReason).toBeUndefined()
    expect(repo.activeSessions()).toHaveLength(1)
  })

  it('un motivo que ya no existe en el vocabulario se lee como ausente', () => {
    // La base es texto: una razon de una version futura o retirada no puede
    // colarse como LoopStopReason y reventar la etiqueta del panel.
    repo.save({ ...SESION, stoppedReason: 'resuelto' })
    repo.save({ ...SESION, stoppedReason: 'inventada' as LoopSession['stoppedReason'] })

    expect(repo.get('p1')?.stoppedReason).toBeUndefined()
  })
})
