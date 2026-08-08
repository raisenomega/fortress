import { lstatSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'

const SKIP = new Set(['node_modules', '.git'])

/** Rutas de archivos y carpetas del proyecto, salteando node_modules/.git y symlinks. */
function walk(dir: string, acc: string[] = []): string[] {
  let entries: string[] = []
  try {
    entries = readdirSync(dir)
  } catch {
    return acc
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue
    const full = join(dir, name)
    const stat = lstatSync(full)
    acc.push(full)
    if (stat.isDirectory()) walk(full, acc)
  }
  return acc
}

/**
 * Garantiza que auditar NO deje rastro. Los probes de build (`tsc -b`, `vite build`)
 * crean artefactos (tsbuildinfo, dist) en el proyecto. Se anota el arbol antes, se
 * corre `work`, y se borra CUALQUIER ruta nueva despues (mas profundo primero, para
 * vaciar carpetas). Nunca toca lo que ya existia ni la fuente: un proyecto de
 * PRODUCCION queda byte-identico tras la auditoria.
 */
export async function readOnly<T>(projectPath: string, work: () => Promise<T>): Promise<T> {
  const before = new Set(walk(projectPath))
  try {
    return await work()
  } finally {
    const fresh = walk(projectPath).filter((path) => !before.has(path))
    for (const path of fresh.sort((a, b) => b.length - a.length)) {
      rmSync(path, { recursive: true, force: true })
    }
  }
}
