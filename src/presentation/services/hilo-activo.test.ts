import type Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { useConstruirStore } from '../stores/construir-store'
import { escribirAssistant, escribirUser } from './hilo-activo'
import { rehidratar } from './rehidratar-el-hilo'
import { filasDe, rigDelHilo } from './hilo-activo-rig'

/** B1 con el cajon REAL: un turno = 2 filas, reabrir devuelve lo mismo. */
let db: Database.Database
beforeEach(() => void (db = rigDelHilo()))

describe('el chat deja de volver a cero', () => {
  it('un turno = EXACTAMENTE 2 filas, contenido exacto y TACHADO preservado', async () => {
    await escribirUser({ projectId: 'p1', modo: 'plan' }, 'arregla la clave')
    await escribirAssistant('hecho: {"apiKey":"***"} quedo tachada')
    expect(filasDe(db).map((f) => [f.role, f.content])).toEqual([
      ['user', 'arregla la clave'],
      ['assistant', 'hecho: {"apiKey":"***"} quedo tachada']
    ])
  })

  it('cerrar y reabrir: rehidratar devuelve los mensajes identicos y en orden', async () => {
    await escribirUser({ projectId: 'p1', modo: 'plan' }, 'hola')
    await escribirAssistant('que tal')
    useConstruirStore.setState({ messages: [], hiloActivo: null })
    await rehidratar({ projectId: 'p1', modo: 'plan' })
    expect(useConstruirStore.getState().messages).toEqual([
      { role: 'user', text: 'hola' },
      { role: 'assistant', text: 'que tal' }
    ])
  })

  it('el hilo LEGADO (chat_id NULL) jamas aparece al rehidratar', async () => {
    db.prepare("INSERT INTO chat_messages (id, project_id, role, content, mode, created_at) VALUES ('viejo','p1','user','del terminal','supervisado','2026-09-01')").run() // prettier-ignore
    await rehidratar({ projectId: 'p1', modo: 'plan' })
    expect(useConstruirStore.getState().messages).toEqual([])
  })

  it('intent vacio: titulo de reserva no vacio', async () => {
    await escribirUser({ projectId: 'p1', modo: 'plan' }, '   ')
    const hilo = db.prepare('SELECT titulo FROM chats').get() as { titulo: string }
    expect(hilo.titulo.length).toBeGreaterThan(0)
  })
})
