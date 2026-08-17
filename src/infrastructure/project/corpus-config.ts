import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { parseCorpusConfig, type CorpusConfig } from '@domain/project/corpus-config'
import { FORTRESS_CONFIG } from './fortress-config'

/**
 * Lee la clave `corpus` del fichero donde el proyecto ya declara lo suyo. Es una
 * lectura APARTE de la de la politica de integracion a proposito: aquella exige
 * su bloque y da el fichero por invalido si falta, asi que compartir lectura
 * haria que un proyecto perdiera su politica por declarar su corpus.
 *
 * Reparto tomado de `fortress-config.ts`, que lee el mismo fichero: la
 * validacion vive en el dominio; esto solo toca disco.
 */
export function readCorpusConfig(projectPath: string): CorpusConfig {
  const path = join(projectPath, FORTRESS_CONFIG)
  if (!existsSync(path)) return { kind: 'not-present' }

  try {
    return parseCorpusConfig(readFileSync(path, 'utf8'))
  } catch (error) {
    const detalle = error instanceof Error ? error.message : 'no se pudo leer'
    return { kind: 'invalid', reason: `${path}: ${detalle}` }
  }
}
