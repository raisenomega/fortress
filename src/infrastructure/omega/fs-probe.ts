import { existsSync, readFileSync, statSync } from 'fs'
import { isAbsolute, join, relative } from 'path'
import type { FileProbe } from '@domain/omega/finding-check'
import type { FileSnippet, FilesystemProbe } from '@domain/omega/filesystem-probe'

const MISSING: FileProbe = { exists: false, lineCount: 0 }
const NO_SNIPPET: FileSnippet = { found: false, lines: [] }

/** Bloquea salir del proyecto: la ruta viene de un agente no confiable. */
function safeRead(projectPath: string, relativeFile: string): string | null {
  const full = join(projectPath, relativeFile)
  const rel = relative(projectPath, full)
  if (rel.startsWith('..') || isAbsolute(rel)) return null
  if (!existsSync(full) || !statSync(full).isFile()) return null
  return readFileSync(full, 'utf8')
}

/**
 * Sondea el disco por un archivo del proyecto. SOLO lectura. La ruta del
 * hallazgo viene de un agente (no confiable): se bloquea salir del proyecto
 * (path traversal) antes de tocar nada. OMEGA jamas escribe.
 */
export function createFsProbe(): FilesystemProbe {
  return {
    probe: (projectPath, relativeFile) => {
      try {
        const content = safeRead(projectPath, relativeFile)
        return content === null ? MISSING : { exists: true, lineCount: content.split('\n').length }
      } catch {
        return MISSING
      }
    },

    snippet: (projectPath, relativeFile, line) => {
      try {
        const content = safeRead(projectPath, relativeFile)
        if (content === null) return NO_SNIPPET
        const rows = content.split('\n')
        const from = Math.max(1, line - 3)
        const to = Math.min(rows.length, line + 3)
        const lines: Array<{ n: number; text: string }> = []
        for (let n = from; n <= to; n += 1) lines.push({ n, text: rows[n - 1] })
        return { found: true, lines }
      } catch {
        return NO_SNIPPET
      }
    }
  }
}
