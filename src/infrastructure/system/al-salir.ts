import { liveChildCount, matarYaATodos } from '../claude-code/child-registry'
import { closeDatabase, databasePath } from '../persistence/database'
import { trazarApagado } from './traza-apagado'

/**
 * Lo que la app hace al salir: matar a TODOS sus hijos YA —SIGKILL sincrono, sin
 * la gracia del Detener (PASO 153): el reindex del arranque cuelga del main con
 * pipes abiertos y la escalada `unref` no dispara en el apagado, asi que el main
 * "no moria" (la X no mataba todo)— y luego cerrar la base (checkpoint del WAL).
 *
 * Cada paso se TRAZA antes y despues (sincrono, fsync por linea): si el apagado
 * cuelga o lo matan a media, la ultima linea dice donde —la aguja del bug de la X
 * es `closeDb:after` con el `-wal` aun presente—. La traza nunca tumba el cierre.
 */
export function alSalir(): void {
  const db = databasePath()
  trazarApagado(db, 'alSalir:enter', `hijos=${liveChildCount()}`)
  trazarApagado(db, 'matar:before', `hijos=${liveChildCount()}`)
  const muertos = matarYaATodos()
  trazarApagado(db, 'matar:after', `muertos=${muertos} vivos=${liveChildCount()}`)
  trazarApagado(db, 'closeDb:before')
  closeDatabase()
  trazarApagado(db, 'closeDb:after')
  trazarApagado(db, 'alSalir:exit')
}
