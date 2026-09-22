import { readdirSync } from 'node:fs'
import { ecosistemasDe, registrosDe } from '@domain/sandbox/registros-de-paquetes'

/**
 * A donde puede salir ESTE proyecto: los registros de los ecosistemas que
 * declara en su raiz (ADR-092, casilla 2). Sin manifiesto, a ningun sitio. Lo
 * comparten la clase A (la config del CLI) y la clase B (el proxy del gate):
 * una sola lectura, para que las dos listas no puedan divergir.
 */
export function registrosDelProyecto(projectPath: string): readonly string[] {
  return registrosDe(ecosistemasDe(manifiestosDe(projectPath)))
}

/** Los ficheros de la raiz del proyecto, o ninguno si no se puede leer. */
function manifiestosDe(projectPath: string): readonly string[] {
  try {
    return readdirSync(projectPath)
  } catch {
    return []
  }
}
