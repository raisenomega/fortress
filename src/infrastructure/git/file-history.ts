import { execFile } from 'child_process'
import { SIN_HOOKS } from '../sandbox/git-sin-hooks'
import { gitEnv } from './git-env'
import type { FileHistory } from '@domain/project/file-history'

const ENV = gitEnv()
const TIMEOUT_MS = 15 * 1000

/**
 * Fecha del ultimo commit que toco el archivo, en ISO estricto (`%cI`), o
 * cadena vacia si no lo toco ninguno (o si git falla).
 *
 * NO se usa `--since`: git parsea esa fecha con approxidate y, cuando no la
 * entiende, IGNORA el filtro en silencio y devuelve el commit igual. Aplicado
 * aqui eso daria "el archivo cambio" siempre que la fecha fuera rara — es
 * decir, extinguiria hallazgos por un fallo de parseo. La comparacion se hace
 * aqui, donde una fecha ilegible es un `NaN` visible y no un permiso tacito.
 *
 * `--` separa la ruta de las revisiones: un archivo que se llame como una rama
 * no puede cambiar el significado del comando.
 */
function lastTouch(cwd: string, file: string): Promise<string> {
  return new Promise((resolve) => {
    const args = ['log', '-1', '--format=%cI', '--', file]
    execFile(
      'git',
      [...SIN_HOOKS, ...args],
      { cwd, env: ENV, timeout: TIMEOUT_MS },
      (error, out) => {
        resolve(error ? '' : out.trim())
      }
    )
  })
}

/** Adaptador de git para la marca de MITIGADO (`conservar-mitigado`). */
export function createGitFileHistory(): FileHistory {
  return {
    changedSince: async (projectPath, file, since) => {
      // Un hallazgo global (sin archivo) o sin fecha no se puede comprobar, y
      // lo que no se puede comprobar no se extingue.
      if (file.trim() === '' || since.trim() === '') return false

      const desde = Date.parse(since)
      const tocado = Date.parse(await lastTouch(projectPath, file))

      // Cualquier NaN (sin commits, fecha ilegible) cae a false por la
      // comparacion: ante la duda, el hallazgo se conserva.
      return tocado > desde
    }
  }
}
