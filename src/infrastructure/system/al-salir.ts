import { matarYaATodos } from '../claude-code/child-registry'
import { closeDatabase } from '../persistence/database'

/**
 * Lo que la app hace al salir: matar a TODOS sus hijos YA —SIGKILL sincrono, sin
 * la gracia del Detener (PASO 153): el reindex del arranque cuelga del main con
 * pipes abiertos y la escalada `unref` no dispara en el apagado, asi que el main
 * "no moria" (la X no mataba todo)— y luego cerrar la base (checkpoint del WAL).
 */
export function alSalir(): void {
  matarYaATodos()
  closeDatabase()
}
