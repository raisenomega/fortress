import { createHash } from 'crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { dirname, join, relative } from 'path'
import { listDirs, listFiles } from './list-files'

export interface Snapshot {
  /** ruta relativa -> sha256, para cada archivo. */
  readonly hashes: ReadonlyMap<string, string>
  /** carpetas que existian (para no dejar dirs nuevos vacios tras restaurar). */
  readonly dirs: ReadonlySet<string>
  /** copia byte-a-byte del arbol, de donde se restaura en la Capa 2. */
  readonly copyDir: string
}

export function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

/** CAPA 1 — la foto "antes": hashea Y copia cada archivo (sin node_modules/.git). */
export function takeSnapshot(projectPath: string): Snapshot {
  const copyDir = mkdtempSync(join(tmpdir(), 'ro-snap-'))
  const hashes = new Map<string, string>()
  for (const file of listFiles(projectPath)) {
    const rel = relative(projectPath, file)
    hashes.set(rel, sha256(file))
    const dest = join(copyDir, rel)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(file, dest)
  }
  const dirs = new Set(listDirs(projectPath).map((d) => relative(projectPath, d)))
  return { hashes, dirs, copyDir }
}
