import type { Db } from './database'
import { CHAT_MESSAGES_COLUMNS, CHAT_MESSAGES_INDEXES } from './schema-chat-messages'

const filas = (db: Db, tabla: string): number =>
  (db.prepare(`SELECT COUNT(*) c FROM ${tabla}`).get() as { c: number }).c

const columnas = (db: Db, tabla: string): string[] =>
  (db.pragma(`table_info(${tabla})`) as { name: string }[]).map((c) => c.name)

/**
 * El recambio del multi-chat (PASO 104, B0): `chat_messages` gana `chat_id` y
 * su `project_id` deja de ser NOT NULL (el hilo libre no tiene proyecto).
 * SQLite no afloja un NOT NULL con ALTER, asi que se recrea con el molde de
 * `expand-agent-runs-kind`: FK OFF fuera de la transaccion (y ON en el
 * finally), copia POR NOMBRE, recuento DENTRO —si no cuadra, revierte entero—
 * y los indices renacen con la tabla. Las filas viejas quedan con `chat_id`
 * NULL: el hilo LEGADO por proyecto, sin fabricar historia.
 */
export function expandChatMessagesHilo(db: Db): void {
  if (columnas(db, 'chat_messages').includes('chat_id')) return

  db.pragma('foreign_keys = OFF')
  try {
    db.transaction(() => {
      const antes = filas(db, 'chat_messages')
      db.exec(`CREATE TABLE chat_messages_nueva (${CHAT_MESSAGES_COLUMNS})`)
      const comunes = columnas(db, 'chat_messages').filter((c) =>
        columnas(db, 'chat_messages_nueva').includes(c)
      )
      db.exec(`INSERT INTO chat_messages_nueva (${comunes}) SELECT ${comunes} FROM chat_messages`)

      const copiadas = filas(db, 'chat_messages_nueva')
      if (copiadas !== antes) {
        throw new Error(`chat_messages: se copiaron ${copiadas} de ${antes} filas`)
      }

      db.exec('DROP TABLE chat_messages')
      db.exec('ALTER TABLE chat_messages_nueva RENAME TO chat_messages')
      db.exec(CHAT_MESSAGES_INDEXES)
    })()
  } finally {
    db.pragma('foreign_keys = ON')
  }
}
