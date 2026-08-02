import type { HealthCheck } from '@domain/health/health-check'
import { getDatabase } from '../persistence/database'

const ID = 'sqlite'
const LABEL = 'Base de datos local'

const FIX =
  'Cierra FORTRESS y borra fortress.db de la carpeta de datos de la app. ' +
  'Se creara una base nueva; perderas el historial de chat, no tus proyectos en disco.'

/**
 * `PRAGMA integrity_check` recorre la base entera y devuelve 'ok' o la lista de
 * inconsistencias. Ademas se hace una lectura real: una base intacta pero
 * ilegible (permisos, disco lleno) tambien es un fallo.
 */
export function checkDatabase(): HealthCheck {
  try {
    const db = getDatabase()
    const rows = db.pragma('integrity_check') as Array<{ integrity_check: string }>
    const verdict = rows[0]?.integrity_check ?? 'sin respuesta'

    if (verdict !== 'ok') {
      return { id: ID, label: LABEL, level: 'error', detail: `Base corrupta: ${verdict}`, fix: FIX }
    }

    const projects = db.prepare('SELECT COUNT(*) AS total FROM projects').get() as {
      total: number
    }
    return {
      id: ID,
      label: LABEL,
      level: 'ok',
      detail: `Integra y legible · ${projects.total} proyectos`,
      fix: null
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'fallo desconocido'
    return { id: ID, label: LABEL, level: 'error', detail: `No se pudo leer: ${detail}`, fix: FIX }
  }
}
