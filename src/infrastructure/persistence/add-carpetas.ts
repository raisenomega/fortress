import type { Db } from './database'
import { hasColumn } from './has-column'

/**
 * Carpetas del organizador de libre (PASO 114): columna ADITIVA sobre la base
 * viva, molde de add-finding-memory — cero recambio, cero backfill. NULL =
 * hilo suelto, exactamente lo que toda fila ya es. `ON DELETE SET NULL` es el
 * borrado seguro POR ESQUEMA: quitar la carpeta jamas pierde conversaciones
 * (requiere `foreign_keys = ON`, que database.ts enciende en cada conexion).
 * El indice va DESPUES del ALTER — sobre la tabla sin columna explota al
 * arrancar (la leccion del 104). La tabla `carpetas` la crea el esquema base,
 * que corre antes que las migraciones (mismo trato que `chats` en B0).
 */
export function addCarpetas(db: Db): void {
  if (!hasColumn(db, 'chats', 'carpeta_id')) {
    db.exec('ALTER TABLE chats ADD COLUMN carpeta_id TEXT REFERENCES carpetas(id) ON DELETE SET NULL') // prettier-ignore
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_chats_carpeta ON chats (carpeta_id, updated_at)')
}
