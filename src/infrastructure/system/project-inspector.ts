import { existsSync, readdirSync } from 'fs'
import { basename, join } from 'path'
import type { NewProject } from '@domain/project/project'
import { detectStack } from '@domain/project/stack'
import { readGitInfo } from './git-info'
import { readDependencies } from './read-dependencies'

function rootFiles(projectPath: string): string[] {
  try {
    return readdirSync(projectPath, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
  } catch {
    return []
  }
}

/**
 * Deduce todo lo que se puede sobre un proyecto a partir de su carpeta:
 * nombre, stack, git y si ya tiene CLAUDE.md. El operador puede corregirlo
 * antes de confirmar.
 */
export function inspectProject(projectPath: string): NewProject {
  const git = readGitInfo(projectPath)

  return {
    name: basename(projectPath),
    path: projectPath,
    stack: detectStack({
      files: rootFiles(projectPath),
      dependencies: readDependencies(projectPath)
    }),
    gitRemote: git.remote,
    gitBranch: git.branch,
    hasClaude: existsSync(join(projectPath, 'CLAUDE.md'))
  }
}
