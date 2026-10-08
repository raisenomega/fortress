import Database from 'better-sqlite3'
import { SCHEMA } from '../../infrastructure/persistence/schema'
import { createSqliteChatRepository } from '../../infrastructure/persistence/sqlite-chat-repository'
import { useConstruirStore } from '../stores/construir-store'
import { _inyectarPuerto, _resetTurno } from './hilo-activo'

/** Rig de B1: el cajon REAL (sqlite :memory: + repo de B0) inyectado como
 *  puerto, y el store a cero. Solo para tests — fidelidad hasta el CHECK. */
export function rigDelHilo(): Database.Database {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  db.prepare("INSERT INTO projects (id, name, path, created_at) VALUES ('p1','Uno','/tmp/p1','2026-10-08'),('p2','Dos','/tmp/p2','2026-10-08')").run() // prettier-ignore
  const r = createSqliteChatRepository(db as never)
  listas = 0
  _inyectarPuerto({
    createHilo: async (n) => r.createChat(n),
    listHilos: async (p) => {
      listas += 1
      return r.listChats(p)
    },
    listByHilo: async (id) => r.listByChat(id),
    addToHilo: async (id, m) => r.addToChat(id, m),
    listarCarpetas: async () => r.listarCarpetas(),
    listarSueltos: async () => r.listarHilosSueltos(),
    borrarHilo: async (id) => r.borrarHilo(id),
    crearCarpeta: async (nombre) => r.crearCarpeta(nombre),
    hilosPorCarpeta: async (id) => r.listarHilosPorCarpeta(id),
    renombrarHilo: async (id, t) => r.renombrarHilo(id, t),
    moverHilo: async (id, c) => r.moverHilo(id, c),
    renombrarCarpeta: async (id, n) => r.renombrarCarpeta(id, n),
    borrarCarpeta: async (id, m) => (m === 'con-hilos' ? r.borrarCarpetaConHilos(id) : r.borrarCarpeta(id)) // prettier-ignore
  })
  useConstruirStore.setState({ messages: [], draft: null, hiloActivo: null, rehidratacionPendiente: false }) // prettier-ignore
  _resetTurno()
  return db
}

let listas = 0
/** Cuantas cargas (listHilos) corrieron: pin del camino feliz sin recargas. */
export const contadorDeListas = (): number => listas

export const filasDe = (
  db: Database.Database
): { role: string; content: string; chat_id: string }[] =>
  db.prepare('SELECT role, content, chat_id FROM chat_messages ORDER BY rowid').all() as never
