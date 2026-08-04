import { existsSync, readFileSync, statSync } from 'fs'
import { isAbsolute, join, relative } from 'path'
import type { FileProbe } from '@domain/omega/finding-check'
import type { FilesystemProbe } from '@domain/omega/filesystem-probe'

const MISSING: FileProbe = { exists: false, lineCount: 0 }

/**
 * Sondea el disco por un archivo del proyecto. SOLO lectura. La ruta del
 * hallazgo viene de un agente (no confiable): se bloquea salir del proyecto
 * (path traversal) antes de tocar nada. OMEGA jamas escribe.
 */
export function createFsProbe(): FilesystemProbe {
  return {
    probe: (projectPath, relativeFile) => {
      try {
        const full = join(projectPath, relativeFile)
        const rel = relative(projectPath, full)
        if (rel.startsWith('..') || isAbsolute(rel)) return MISSING
        if (!existsSync(full) || !statSync(full).isFile()) return MISSING
        return { exists: true, lineCount: readFileSync(full, 'utf8').split('\n').length }
      } catch {
        return MISSING
      }
    }
  }
}
