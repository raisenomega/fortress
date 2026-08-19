import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { parseAutoMergeConfig, type ConfigState } from '@domain/repair/auto-merge-config'
import { parseScopeGroups, type ScopeGroup } from '@domain/repair/scope-groups'

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

/**
 * Los grupos de co-modificacion que el proyecto declara. Se lee del WORKTREE,
 * no del checkout vivo: el sandbox se crea desde el ancla antes de que el
 * generador escriba, asi que ese config es el que regia cuando la propuesta
 * nacio — y es el mismo arbol contra el que OMEGA juzgara el fix.
 *
 * Cualquier problema —no existe, no es JSON, un grupo mal escrito— sale como
 * lista vacia, y entonces manda la correa universal. Nunca al reves: un archivo
 * que no se entiende no puede ensanchar el perimetro.
 */
export function readScopeGroups(projectPath: string): readonly ScopeGroup[] {
  const path = join(projectPath, FORTRESS_CONFIG)
  if (!existsSync(path)) return []

  try {
    return parseScopeGroups(JSON.parse(readFileSync(path, 'utf8')))
  } catch {
    return []
  }
}
