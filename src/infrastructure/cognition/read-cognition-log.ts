import { readFileSync } from 'fs'
import { join } from 'path'
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
    return parseCognitionLog(readFileSync(join(projectPath, FILE), 'utf8'))
  } catch {
    return EMPTY_SNAPSHOT
  }
}
