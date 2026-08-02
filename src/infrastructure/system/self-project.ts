import { app } from 'electron'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import type { NewProject } from '@domain/project/project'
import { inspectProject } from './project-inspector'

/** Identidad propia: no es configuracion, es como FORTRESS se reconoce. */
const PACKAGE_NAME = 'fortress-command-center'
const MAX_DEPTH = 4

function isOwnPackage(dir: string): boolean {
  try {
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
      name?: string
    }
    return manifest.name === PACKAGE_NAME
  } catch {
    return false
  }
}

/**
 * `app.getAppPath()` no siempre apunta a la raiz del codigo (al ejecutar un
 * script suelto devuelve su carpeta), asi que se sube hasta encontrar el
 * package.json propio — no cualquiera.
 */
function findSourceRoot(start: string): string | null {
  let dir = start
  for (let depth = 0; depth <= MAX_DEPTH; depth += 1) {
    if (isOwnPackage(dir)) return dir
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
  return null
}

/**
 * FORTRESS puede auditarse a si misma con sus propios agentes. Solo tiene
 * sentido cuando el codigo fuente esta en disco: en la app empaquetada vive
 * dentro del asar, que no es una carpeta escaneable.
 */
export function selfProject(): NewProject | null {
  const appPath = app.getAppPath()
  if (appPath.includes('.asar')) return null

  const root = findSourceRoot(appPath)
  if (!root) return null

  return { ...inspectProject(root), name: 'FORTRESS Command Center' }
}
