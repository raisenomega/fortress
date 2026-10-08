import type Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { useConstruirStore } from '../stores/construir-store'
import { escribirUser } from './hilo-activo'
import { filasDe, rigDelHilo } from './hilo-activo-rig'

/** B1: cada par (proyecto, modo) tiene SU hilo — por igualdad exacta. */
let db: Database.Database
beforeEach(() => void (db = rigDelHilo()))

describe('un hilo por par (proyecto, modo)', () => {
  it('cambio de MODO a media sesion: hilo nuevo; el viejo intacto', async () => {
    await escribirUser({ projectId: 'p1', modo: 'plan' }, 'plan uno')
    const primero = useConstruirStore.getState().hiloActivo?.id
    await escribirUser({ projectId: 'p1', modo: 'investigacion' }, 'investiga dos')
    const filas = filasDe(db)
    expect(new Set(filas.map((f) => f.chat_id)).size).toBe(2)
    expect(filas.find((f) => f.content === 'investiga dos')?.chat_id).not.toBe(primero)
  })

  it('cambio de PROYECTO: hilo propio aunque el modo coincida', async () => {
    await escribirUser({ projectId: 'p1', modo: 'plan' }, 'de p1')
    await escribirUser({ projectId: 'p2', modo: 'plan' }, 'de p2')
    expect(new Set(filasDe(db).map((f) => f.chat_id)).size).toBe(2)
  })

  it('libre: proyecto NULL, su propio hilo, no se mezcla con construir', async () => {
    await escribirUser({ projectId: 'p1', modo: 'plan' }, 'con repo')
    await escribirUser({ projectId: null, modo: 'libre' }, 'sin repo')
    const libre = db.prepare('SELECT project_id FROM chats WHERE modo = ?').get('libre') as { project_id: string | null } // prettier-ignore
    expect(libre.project_id).toBeNull()
    expect(new Set(filasDe(db).map((f) => f.chat_id)).size).toBe(2)
  })
})
