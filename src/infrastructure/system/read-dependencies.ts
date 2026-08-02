import { readFileSync } from 'fs'
import { join } from 'path'

function readText(path: string): string | null {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

function fromPackageJson(projectPath: string): string[] {
  const raw = readText(join(projectPath, 'package.json'))
  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)
    const manifest = parsed as { dependencies?: object; devDependencies?: object }
    return [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {})
    ]
  } catch {
    // Un package.json corrupto no debe impedir agregar el proyecto.
    return []
  }
}

/** `fastapi>=0.100  # comentario` -> `fastapi` */
function fromRequirements(projectPath: string): string[] {
  const raw = readText(join(projectPath, 'requirements.txt'))
  if (!raw) return []

  return raw
    .split('\n')
    .map((line) => line.split('#')[0].trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(/[<>=!~[\s]/)[0].trim())
    .filter((name) => name.length > 0)
}

export function readDependencies(projectPath: string): string[] {
  return [...fromPackageJson(projectPath), ...fromRequirements(projectPath)]
}
