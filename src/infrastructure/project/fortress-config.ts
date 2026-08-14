import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { parseAutoMergeConfig, type ConfigState } from '@domain/repair/auto-merge-config'

/** Donde el proyecto declara lo suyo. La ruta se cubre a si misma en la lista. */
export const FORTRESS_CONFIG = '.fortress/config'

/**
 * Lee la configuracion del proyecto auditado. Mecanica tomada de la lectura del
 * `.mcp.json` (try/catch, JSON estricto, sin romper nunca el arranque), pero
 * NO su forma de retorno: aquel colapsa "no existe" e "ilegible" en null, y
 * aqui esa distincion es justo lo que decide si la integracion automatica sigue
 * viva. La validacion vive en el dominio; esto solo toca disco.
 */
export function readFortressConfig(projectPath: string): ConfigState {
  const path = join(projectPath, FORTRESS_CONFIG)
  if (!existsSync(path)) return { kind: 'not-present' }

  try {
    return parseAutoMergeConfig(readFileSync(path, 'utf8'))
  } catch (error) {
    const detalle = error instanceof Error ? error.message : 'no se pudo leer'
    return { kind: 'invalid', reason: `${path}: ${detalle}` }
  }
}
