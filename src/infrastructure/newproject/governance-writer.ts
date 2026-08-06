import { writeFileSync } from 'fs'
import { join } from 'path'
import type { GovernanceWriter } from '@application/newproject/execute-configuration'
import { err } from '@domain/shared/result'
import { gitCommitAll } from '../git/git-commit'

const COMMIT_MSG = 'docs: constitución y marco del proyecto'

/**
 * Escribe cada archivo del marco y hace el commit inicial. `.gitignore` viene
 * primero en el mapa, asi el `git add -A` no incluye los docs internos.
 */
export function createGovernanceWriter(): GovernanceWriter {
  return {
    write: async (projectPath, files) => {
      try {
        for (const [name, content] of Object.entries(files)) {
          writeFileSync(join(projectPath, name), content, 'utf8')
        }
      } catch (error) {
        return err(error instanceof Error ? error.message : 'No se pudo escribir el marco')
      }
      return gitCommitAll(projectPath, COMMIT_MSG)
    }
  }
}
