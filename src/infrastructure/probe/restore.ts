import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs'
import { rutaContenida } from '../fs/ruta-contenida'
import { dirname, join, relative } from 'path'
import { listDirs, listFiles } from './list-files'
import { sha256, type Snapshot } from './snapshot'

/** Borra las carpetas nuevas que quedaron vacias (dist/ tras vaciarla). */
function pruneNewEmptyDirs(projectPath: string, snap: Snapshot): void {
  for (const dir of listDirs(projectPath).sort((a, b) => b.length - a.length)) {
    const rel = relative(projectPath, dir)
    if (!snap.dirs.has(rel) && readdirSync(dir).length === 0) {
      rmSync(dir, { recursive: true, force: true })
    }
  }
}

/**
 * CAPA 2 — contencion: deja el arbol EXACTO como el snapshot. Borra lo nuevo,
 * restaura (desde la copia byte-a-byte) lo modificado o borrado. Cubre el caso
 * duro: un prebuild que reescribe archivos ya existentes (inject-sw-version).
 */
export function restore(projectPath: string, snap: Snapshot): void {
  for (const file of listFiles(projectPath)) {
    if (!snap.hashes.has(relative(projectPath, file))) rmSync(file, { force: true })
  }
  for (const [rel, hash] of snap.hashes) {
    const dest = rutaContenida(projectPath, rel)
    if (dest === null) continue
    if (existsSync(dest) && sha256(dest) === hash) continue
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(join(snap.copyDir, rel), dest)
  }
  pruneNewEmptyDirs(projectPath, snap)
}
