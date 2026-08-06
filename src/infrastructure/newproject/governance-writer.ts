import { writeFileSync } from 'fs'
import { join } from 'path'
import type { GovernanceWriter } from '@application/newproject/execute-configuration'
import { COMMITTED_DOCS } from '@domain/chat/config-docs'
import { err } from '@domain/shared/result'
import { gitCommit } from '../git/git-commit'

const COMMIT_MSG = 'docs: constitución y marco del proyecto'

/** Nombre plano de archivo del marco: sin separadores ni traversal. Defensa en
 *  profundidad por si algun dia llega un nombre que no sea de la lista conocida. */
function isSafeName(name: string): boolean {
  return name.length > 0 && !name.includes('/') && !name.includes('\\') && !name.includes('..')
}

/**
 * Escribe cada archivo del marco y hace el commit inicial. `.gitignore` viene
 * primero en el mapa, asi el `git add -A` no incluye los docs internos.
 */
export function createGovernanceWriter(): GovernanceWriter {
  return {
    write: async (projectPath, files) => {
      try {
        for (const [name, content] of Object.entries(files)) {
          if (!isSafeName(name)) return err(`Nombre de archivo no permitido: ${name}`)
          writeFileSync(join(projectPath, name), content, 'utf8')
        }
      } catch (error) {
        return err(error instanceof Error ? error.message : 'No se pudo escribir el marco')
      }
      // Solo los commiteables: CONSTITUTION/COGNITION-LOG/SECURITY-BASELINE quedan
      // en .gitignore y fuera del historial (estrategia interna).
      return gitCommit(projectPath, COMMITTED_DOCS, COMMIT_MSG)
    }
  }
}
