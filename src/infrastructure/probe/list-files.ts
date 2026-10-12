import { lstatSync, readdirSync } from 'fs'
import { join, relative } from 'path'
import { rutasIgnoradas } from './rutas-ignoradas'

const SKIP = new Set(['node_modules', '.git'])

function walk(
  dir: string,
  root: string,
  ignored: ReadonlySet<string>,
  onFile: (p: string) => void,
  onDir: (p: string) => void
): void {
  let names: string[] = []
  try {
    names = readdirSync(dir)
  } catch {
    return
  }
  for (const name of names) {
    if (SKIP.has(name)) continue
    const full = join(dir, name)
    // La foto de integridad vela la FUENTE: lo gitignored (build) queda fuera (PASO 172a).
    if (ignored.has(relative(root, full))) continue
    const stat = lstatSync(full)
    if (stat.isDirectory()) {
      onDir(full)
      walk(full, root, ignored, onFile, onDir)
    } else if (stat.isFile()) onFile(full)
  }
}

/** Archivos regulares del proyecto (sin node_modules/.git/gitignored ni symlinks). */
export function listFiles(dir: string): string[] {
  const files: string[] = []
  walk(dir, dir, rutasIgnoradas(dir), (f) => files.push(f), () => {}) // prettier-ignore
  return files
}

/** Carpetas del proyecto (sin node_modules/.git/gitignored). */
export function listDirs(dir: string): string[] {
  const dirs: string[] = []
  walk(dir, dir, rutasIgnoradas(dir), () => {}, (d) => dirs.push(d)) // prettier-ignore
  return dirs
}
