import type { Db } from './database'
import { CHATS_COLUMNS, CHATS_INDEXES } from './schema-chat-messages'

const filas = (db: Db, tabla: string): number =>
  (db.prepare(`SELECT COUNT(*) c FROM ${tabla}`).get() as { c: number }).c

const columnas = (db: Db, tabla: string): string[] =>
  (db.pragma(`table_info(${tabla})`) as { name: string }[]).map((c) => c.name)

/** Se mira la DDL guardada, no un numero de version (molde agent_runs). */
function yaAdmiteCto(db: Db): boolean {
  const sql = 'SELECT sql FROM sqlite_master WHERE type = ? AND name = ?'
  const fila = db.prepare(sql).get('table', 'chats') as { sql?: string } | undefined
  return fila?.sql?.includes("'cto'") === true
}

/**
 * El CHECK de `chats.modo` gana 'cto' (PASO 124, corte A del Modo CTO).
 * SQLite no ensancha un CHECK en sitio, asi que se recrea con el molde de
 * `expand-chat-messages-hilo`: FK OFF fuera de la transaccion (y ON en el
 * finally — con las claves activas el DROP arrastraria los mensajes por
 * cascada), copia POR NOMBRE (una base del 104 sin carpeta_id entra igual:
 * queda a NULL, que es lo que un hilo suelto significa), recuento DENTRO
 * —si no cuadra, revierte entero— y los indices renacen con la tabla.
 * Ningun hilo cambia de modo: solo se ensancha el conjunto permitido.
 */
export function expandChatsModoCto(db: Db): void {
  if (yaAdmiteCto(db)) return

  db.pragma('foreign_keys = OFF')
  try {
    db.transaction(() => {
      const antes = filas(db, 'chats')
      db.exec(`CREATE TABLE chats_nueva (${CHATS_COLUMNS})`)
      const comunes = columnas(db, 'chats').filter((c) => columnas(db, 'chats_nueva').includes(c))
      db.exec(`INSERT INTO chats_nueva (${comunes}) SELECT ${comunes} FROM chats`)

      const copiadas = filas(db, 'chats_nueva')
      if (copiadas !== antes) {
        throw new Error(`chats: se copiaron ${copiadas} de ${antes} filas`)
      }

      db.exec('DROP TABLE chats')
      db.exec('ALTER TABLE chats_nueva RENAME TO chats')
      db.exec(CHATS_INDEXES)
    })()
  } finally {
    db.pragma('foreign_keys = ON')
  }
}
