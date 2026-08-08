import { lstatSync, readdirSync } from 'fs'
import { join } from 'path'

const SKIP = new Set(['node_modules', '.git'])

function walk(dir: string, onFile: (p: string) => void, onDir: (p: string) => void): void {
  let names: string[] = []
  try {
    names = readdirSync(dir)
  } catch {
    return
  }
  for (const name of names) {
    if (SKIP.has(name)) continue
    const full = join(dir, name)
    const stat = lstatSync(full)
    if (stat.isDirectory()) {
      onDir(full)
      walk(full, onFile, onDir)
    } else if (stat.isFile()) onFile(full)
  }
}

/** Archivos regulares del proyecto (sin node_modules/.git ni symlinks). */
export function listFiles(dir: string): string[] {
  const files: string[] = []
  walk(
    dir,
    (f) => files.push(f),
    () => {}
  )
  return files
}

/** Carpetas del proyecto (sin node_modules/.git). */
export function listDirs(dir: string): string[] {
  const dirs: string[] = []
  walk(
    dir,
    () => {},
    (d) => dirs.push(d)
  )
  return dirs
}
