import { readFileSync, statSync } from 'fs'
import { rutaContenida } from '../fs/ruta-contenida'
import { EMPTY_SNAPSHOT, type CognitionSnapshot } from '@domain/cognition/cognition-log'
import { parseCognitionLog } from '@domain/cognition/parse-cognition-log'

const FILE = 'COGNITION-LOG.md'

/**
 * Lee el cerebro del proyecto. El contenido se trata como texto y se parsea;
 * nada de lo que ponga ahi dentro se ejecuta ni se interpreta como comando.
 *
 * Que el archivo no exista es lo normal en un proyecto nuevo, no un error: se
 * devuelve un snapshot vacio y la UI lo explica.
 */
export function readCognitionLog(projectPath: string): CognitionSnapshot {
  try {
    // Lo que sale de aqui entra en el prompt del analista. Un COGNITION-LOG.md
    // commiteado como enlace fuera del proyecto seria un canal de exfiltracion:
    // null (fuga, colgante o no se pudo saber) se trata como si no existiera.
    const real = rutaContenida(projectPath, FILE)
    if (real === null || !statSync(real).isFile()) return EMPTY_SNAPSHOT
    return parseCognitionLog(readFileSync(real, 'utf8'))
  } catch {
    return EMPTY_SNAPSHOT
  }
}
