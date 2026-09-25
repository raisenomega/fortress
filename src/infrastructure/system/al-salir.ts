import { killAllChildren } from '../claude-code/child-registry'
import { closeDatabase } from '../persistence/database'

/**
 * Lo que la app hace al salir: matar a TODOS sus hijos y cerrar la base. Antes
 * solo cerraba la base, y un `claude -p` en vuelo sobrevivia a la app: medido
 * el 2026-09-24, el juez del alcance de un loop quedo huerfano dos minutos,
 * gastando, con el servidor del grafo vigilando el repo y reindexandolo.
 */
export function alSalir(): void {
  killAllChildren()
  closeDatabase()
}
